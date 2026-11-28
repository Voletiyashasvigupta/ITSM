package com.northstar.auth.service;

import com.northstar.auth.dto.AuthModels.AuthenticatedUser;
import com.northstar.auth.dto.AuthModels.ApproverOption;
import com.northstar.auth.dto.AuthModels.AccessAssignment;
import com.northstar.auth.dto.AuthModels.AdminUserCreateInput;
import com.northstar.auth.dto.AuthModels.LoginInput;
import com.northstar.auth.dto.AuthModels.PasswordChange;
import com.northstar.auth.dto.AuthModels.RegisterInput;
import com.northstar.auth.dto.AuthModels.RegistrationResponse;
import com.northstar.auth.dto.AuthModels.RoleAssignment;
import com.northstar.auth.dto.AuthModels.TokenResponse;
import com.northstar.auth.dto.AuthModels.UserSummary;
import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.repository.PortalUserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Core business service for user authentication, registration, JWT token generation, and account administration.
 *
 * <p><b>Purpose:</b> Implements security verification, user registration, role and department assignments,
 * password hashing and rotation, administrator user creation, and developer impersonation tokens.
 *
 * <p><b>Downstream / Workflow:</b> Called by {@link com.northstar.auth.controller.AuthController} and
 * {@link com.northstar.auth.controller.AdminUsersController}. Interacts directly with {@link PortalUserRepository}
 * and {@link JwtEncoder}.
 */
@Service
public class AuthService {
    private final PortalUserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final String audience;
    private final long ttlMinutes;

    /**
     * Constructs the AuthService with repository, encoder, and JWT parameters.
     *
     * <p><b>Purpose:</b> Dependency injection for authentication services.
     *
     * <p><b>Downstream / Workflow:</b> Initialized by Spring during startup.
     *
     * @param users The PortalUserRepository.
     * @param passwords The PasswordEncoder.
     * @param jwtEncoder The Nimbus JwtEncoder.
     * @param issuer Token issuer identifier.
     * @param audience Token audience identifier.
     * @param ttlMinutes Token time-to-live in minutes (default 60).
     */
    public AuthService(PortalUserRepository users, PasswordEncoder passwords, JwtEncoder jwtEncoder,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience,
            @Value("${security.jwt.ttl-minutes:60}") long ttlMinutes) {
        this.users = users;
        this.passwords = passwords;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.audience = audience;
        this.ttlMinutes = ttlMinutes;
    }

    /**
     * Registers a new employee account in an inactive state pending role assignment.
     *
     * <p><b>Purpose:</b> Creates a new portal user record with username, email, BCrypt-hashed password,
     * initial null role, and active=false.
     *
     * <p><b>Downstream / Workflow:</b> Saves record to MySQL. The employee cannot sign in until an administrator
     * assigns an active role via {@link #assignAccess(UUID, AccessAssignment, UUID)}.
     *
     * @param input Registration form containing full name, optional/provided username, email, and password.
     * @return RegistrationResponse with PENDING_ROLE_ASSIGNMENT status.
     */
    @Transactional
    public RegistrationResponse register(RegisterInput input) {
        String email = normalizeEmail(input.email());
        String username = (input.username() != null && !input.username().isBlank())
                ? normalizeUsername(input.username())
                : deriveUsername(email);
        String employeeId = (input.employeeId() != null && !input.employeeId().isBlank())
                ? input.employeeId().trim().toUpperCase()
                : generateEmployeeId();
        validatePasswordBytes(input.password());
        if (users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        if (users.existsByUsernameIgnoreCase(username)) throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this username already exists");
        if (users.existsByEmployeeIdIgnoreCase(employeeId)) throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this employee ID already exists");
        try {
            PortalUser user = users.save(new PortalUser(employeeId, username, input.fullName().trim(), email, passwords.encode(input.password()), null, false));
            return new RegistrationResponse(user.getId(), user.getEmployeeId(), user.getUsername(), user.getFullName(), user.getEmail(), "PENDING_ROLE_ASSIGNMENT", user.getCreatedAt());
        } catch (DataIntegrityViolationException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email, username, or employee ID already exists");
        }
    }

    /**
     * Authenticates an employee by corporate username, employee ID, or corporate email and password.
     *
     * <p><b>Purpose:</b> Verifies user credentials with BCrypt and ensures the account is active and has an assigned role.
     *
     * <p><b>Downstream / Workflow:</b> If valid, invokes {@link #issueToken(PortalUser, UUID)} to produce a signed JWT.
     *
     * @param input Login credentials containing username or employee ID and password.
     * @return TokenResponse with Bearer token and user profile.
     */
    public TokenResponse login(LoginInput input) {
        String identifier = input.username().trim();
        PortalUser user = users.findByUsernameIgnoreCase(identifier)
                .or(() -> users.findByEmployeeIdIgnoreCase(identifier))
                .or(() -> users.findByEmail(normalizeEmail(identifier)))
                .orElse(null);
        if (user == null || !passwords.matches(input.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username or password is incorrect");
        }
        if (!user.isActive() || user.getRole() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is waiting for an administrator to assign access");
        }
        return issueToken(user,null);
    }

    /**
     * Issues an impersonation token allowing a manager/administrator to test the portal as another user.
     *
     * <p><b>Purpose:</b> Enables local troubleshooting and workflow verification from another employee's perspective.
     *
     * <p><b>Downstream / Workflow:</b> Verifies caller is MANAGER_ADMIN and targets an active user. Mints a JWT with
     * the target's subject and an {@code impersonated_by} audit claim.
     *
     * @param administratorId The ID of the authenticated administrator.
     * @param targetId The ID of the target user to impersonate.
     * @return TokenResponse with the impersonation JWT.
     */
    @Transactional(readOnly = true)
    public TokenResponse impersonate(UUID administratorId,UUID targetId) {
        PortalUser administrator=findUser(administratorId);
        if(!administrator.isActive()||administrator.getRole()!=PortalRole.MANAGER_ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Manager or administrator access is required");
        PortalUser target=findUser(targetId);
        if(!target.isActive()||target.getRole()==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only active users with an assigned role can be impersonated");
        if(target.getId().equals(administrator.getId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"You are already signed in as this user");
        return issueToken(target,administrator.getId());
    }

    /**
     * Signs and issues a HMAC-SHA256 JWT for the specified user.
     *
     * <p><b>Purpose:</b> Encodes user subject UUID, email, name, and role into claims, signing them with the shared secret.
     *
     * <p><b>Downstream / Workflow:</b> Passed to the frontend client in the Authorization Bearer header for subsequent API calls.
     *
     * @param user The portal user entity.
     * @param impersonatedBy Optional UUID of the administrator impersonating this user.
     * @return TokenResponse.
     */
    private TokenResponse issueToken(PortalUser user,UUID impersonatedBy) {
        Instant now = Instant.now();
        Instant expires = now.plus(ttlMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .audience(List.of(audience))
                .issuedAt(now)
                .expiresAt(expires)
                .subject(user.getId().toString())
                .claim("employee_id", user.getEmployeeId())
                .claim("username", user.getUsername())
                .claim("preferred_username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("roles", List.of(user.getRole().name()));
        if(impersonatedBy!=null) claimsBuilder.claim("impersonated_by",impersonatedBy.toString());
        JwtClaimsSet claims = claimsBuilder.build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).keyId("northstar-hs256").build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", ttlMinutes * 60, authenticated(user));
    }

    /**
     * Retrieves the authenticated user profile for the current session.
     *
     * <p><b>Purpose:</b> Returns identity, department, and role data for the logged-in user.
     *
     * <p><b>Downstream / Workflow:</b> Queried by the frontend on application load (via {@code GET /api/auth/me}).
     *
     * @param id The user UUID.
     * @return AuthenticatedUser DTO.
     */
    @Transactional(readOnly = true)
    public AuthenticatedUser currentUser(UUID id) { return authenticated(findUser(id)); }

    /**
     * Updates an authenticated user's password.
     *
     * <p><b>Purpose:</b> Verifies the current password before encoding and saving the new password.
     *
     * <p><b>Downstream / Workflow:</b> Persists updated password hash in MySQL.
     *
     * @param id User's UUID.
     * @param change Current and new password inputs.
     */
    @Transactional
    public void changePassword(UUID id, PasswordChange change) {
        validatePasswordBytes(change.newPassword());
        PortalUser user = findUser(id);
        if (!passwords.matches(change.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwords.encode(change.newPassword()));
    }

    /**
     * Lists all registered portal users ordered by creation date.
     *
     * <p><b>Purpose:</b> Provides user directory data for administrative management.
     *
     * <p><b>Downstream / Workflow:</b> Rendered in the Administrator User Access management table.
     *
     * @return List of UserSummary DTOs.
     */
    @Transactional(readOnly = true)
    public List<UserSummary> listUsers() {
        return users.findAllByOrderByCreatedAtAsc().stream().map(AuthService::summary).toList();
    }

    /**
     * Lists all active managers and administrators eligible to be selected as approvers.
     *
     * <p><b>Purpose:</b> Provides choices for request approver dropdowns.
     *
     * <p><b>Downstream / Workflow:</b> Consumed by the frontend service request wizard.
     *
     * @return List of ApproverOption DTOs.
     */
    @Transactional(readOnly = true)
    public List<ApproverOption> listApprovers() {
        return users.findAllByRoleAndActiveTrueOrderByFullNameAsc(PortalRole.MANAGER_ADMIN).stream()
                .map(user -> new ApproverOption(user.getId(), user.getFullName())).toList();
    }

    /**
     * Provisions a new user account directly by an administrator.
     *
     * <p><b>Purpose:</b> Allows administrators to create pre-activated users with specified role and department.
     *
     * <p><b>Downstream / Workflow:</b> Saves new user record into MySQL and returns UserSummary.
     *
     * @param input AdminUserCreateInput with name, email, password, role, department.
     * @return UserSummary of the created user.
     */
    @Transactional
    public UserSummary createUser(AdminUserCreateInput input) {
        String email = normalizeEmail(input.email());
        String fullName = input.fullName().trim();
        String username = (input.username() != null && !input.username().isBlank())
                ? normalizeUsername(input.username())
                : deriveUsername(email);
        String employeeId = (input.employeeId() != null && !input.employeeId().isBlank())
                ? input.employeeId().trim().toUpperCase()
                : generateEmployeeId();
        validatePasswordBytes(input.temporaryPassword());
        if (input.role() == PortalRole.EMPLOYEE && input.department() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a department for employee access");
        }
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this username already exists");
        }
        if (users.existsByEmployeeIdIgnoreCase(employeeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this employee ID already exists");
        }
        try {
            PortalUser user = new PortalUser(employeeId, username, fullName, email, passwords.encode(input.temporaryPassword()), input.role(), true);
            user.setDepartment(input.department());
            return summary(users.save(user));
        } catch (DataIntegrityViolationException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email, username, or employee ID already exists");
        }
    }

    /**
     * Updates an existing user's role and activates the account.
     *
     * <p><b>Purpose:</b> Transitions pending users into active participants or promotes them to MANAGER_ADMIN.
     *
     * <p><b>Downstream / Workflow:</b> Modifies and saves user in MySQL. Prevents self-demotion of admins.
     *
     * @param id The target user ID.
     * @param assignment Role assignment input.
     * @param adminId ID of the executing administrator.
     * @return Updated UserSummary.
     */
    @Transactional
    public UserSummary assignRole(UUID id, RoleAssignment assignment, UUID adminId) {
        PortalUser user = findUser(id);
        if (id.equals(adminId) && assignment.role() != PortalRole.MANAGER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot remove your own administrator access");
        }
        user.setRole(assignment.role());
        user.setActive(true);
        return summary(user);
    }

    /**
     * Updates an existing user's role and department.
     *
     * <p><b>Purpose:</b> Configures organizational department mapping and security tier.
     *
     * <p><b>Downstream / Workflow:</b> Persists changes to the user entity in MySQL.
     *
     * @param id The target user ID.
     * @param assignment Access assignment with role and department.
     * @param adminId ID of the executing administrator.
     * @return Updated UserSummary.
     */
    @Transactional
    public UserSummary assignAccess(UUID id, AccessAssignment assignment, UUID adminId) {
        PortalUser user = findUser(id);
        if (id.equals(adminId) && assignment.role() != PortalRole.MANAGER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot remove your own administrator access");
        }
        if (assignment.role() == PortalRole.EMPLOYEE && assignment.department() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a department for employee access");
        }
        user.setRole(assignment.role());
        user.setDepartment(assignment.department());
        user.setActive(true);
        return summary(user);
    }

    /**
     * Helper to find user by ID or throw 404 NOT_FOUND.
     *
     * <p><b>Purpose:</b> Safe entity resolution by UUID.
     *
     * <p><b>Downstream / Workflow:</b> Used internally across service methods.
     *
     * @param id User UUID.
     * @return Found PortalUser.
     */
    private PortalUser findUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }

    /**
     * Trims and lowercases email strings for case-insensitive matching.
     *
     * <p><b>Purpose:</b> Normalization of email identities.
     *
     * <p><b>Downstream / Workflow:</b> Applied before repository queries and entity inserts.
     *
     * @param email Raw email.
     * @return Normalized email.
     */
    private static String normalizeEmail(String email) { return email.trim().toLowerCase(); }

    /**
     * Validates that password byte length does not exceed BCrypt's 72-byte limit.
     *
     * <p><b>Purpose:</b> Safeguard against password truncation vulnerabilities.
     *
     * <p><b>Downstream / Workflow:</b> Checked before hashing passwords.
     *
     * @param password Plaintext password.
     */
    private static void validatePasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
        }
    }

    /**
     * Maps a PortalUser entity to an administrative UserSummary DTO.
     *
     * <p><b>Purpose:</b> DTO projection.
     *
     * <p><b>Downstream / Workflow:</b> Returns sanitized user details to admin controllers.
     *
     * @param user The entity.
     * @return UserSummary DTO.
     */
    private static UserSummary summary(PortalUser user) {
        return new UserSummary(user.getId(), user.getEmployeeId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole(), user.getDepartment(), user.isActive(), user.getCreatedAt());
    }

    /**
     * Maps a PortalUser entity to an AuthenticatedUser profile DTO.
     *
     * <p><b>Purpose:</b> DTO projection for active sessions.
     *
     * <p><b>Downstream / Workflow:</b> Embedded in token responses and currentUser queries.
     *
     * @param user The entity.
     * @return AuthenticatedUser DTO.
     */
    private static AuthenticatedUser authenticated(PortalUser user) {
        return new AuthenticatedUser(user.getId(), user.getEmployeeId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole(), user.getDepartment(), List.of(user.getRole().name()));
    }

    /**
     * Generates a unique corporate employee identifier (e.g. EMP-10001).
     */
    private String generateEmployeeId() {
        for (int i = 0; i < 15; i++) {
            String candidate = "EMP-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
            if (!users.existsByEmployeeIdIgnoreCase(candidate)) return candidate;
        }
        return "EMP-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
    }

    /**
     * Trims and lowercases corporate username strings for consistent matching.
     */
    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }

    /**
     * Derives a corporate username from email prefix or fallback UUID.
     */
    private static String deriveUsername(String email) {
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf('@')).trim().toLowerCase();
        }
        return "user_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
