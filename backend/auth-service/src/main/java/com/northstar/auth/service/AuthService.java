package com.northstar.auth.service;

import com.northstar.auth.dto.AuthModels.AuthenticatedUser;
import com.northstar.auth.dto.AuthModels.ApproverOption;
import com.northstar.auth.dto.AuthModels.AccessAssignment;
import com.northstar.auth.dto.AuthModels.AdminUserCreateInput;
import com.northstar.auth.dto.AuthModels.LoginInput;
import com.northstar.auth.dto.AuthModels.ManagerOption;
import com.northstar.auth.dto.AuthModels.PasswordChange;
import com.northstar.auth.dto.AuthModels.RegisterInput;
import com.northstar.auth.dto.AuthModels.RegistrationResponse;
import com.northstar.auth.dto.AuthModels.RoleAssignment;
import com.northstar.auth.dto.AuthModels.SubordinateSummary;
import com.northstar.auth.dto.AuthModels.TokenResponse;
import com.northstar.auth.dto.AuthModels.UserSummary;
import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.repository.PortalUserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import com.northstar.auth.integration.ServiceNowUserSyncClient;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
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
 * Core business service for user authentication, registration, JWT token generation,
 * reporting hierarchy management, and account administration.
 */
@Service
public class AuthService {
    private final PortalUserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder jwtEncoder;
    private final ServiceNowUserSyncClient serviceNowSyncClient;
    private final String issuer;
    private final String audience;
    private final long ttlMinutes;

    public AuthService(PortalUserRepository users, PasswordEncoder passwords, JwtEncoder jwtEncoder,
            ServiceNowUserSyncClient serviceNowSyncClient,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience,
            @Value("${security.jwt.ttl-minutes:60}") long ttlMinutes) {
        this.users = users;
        this.passwords = passwords;
        this.jwtEncoder = jwtEncoder;
        this.serviceNowSyncClient = serviceNowSyncClient;
        this.issuer = issuer;
        this.audience = audience;
        this.ttlMinutes = ttlMinutes;
    }

    /**
     * Registers a new employee account in an inactive state pending role assignment.
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
            serviceNowSyncClient.syncUserAsync(user.getUsername(), user.getFullName(), user.getEmail(), "GENERAL", null);
            return new RegistrationResponse(user.getId(), user.getEmployeeId(), user.getUsername(), user.getFullName(), user.getEmail(), "PENDING_ROLE_ASSIGNMENT", user.getCreatedAt());
        } catch (DataIntegrityViolationException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email, username, or employee ID already exists");
        }
    }

    /**
     * Authenticates an employee by corporate username, employee ID, or corporate email and password.
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
        return issueToken(user, null);
    }

    /**
     * Issues an impersonation token allowing a manager/administrator to test the portal as another user.
     */
    public TokenResponse impersonate(UUID callerId, UUID targetId) {
        PortalUser administrator = findUser(callerId);
        PortalUser target = findUser(targetId);
        if (!administrator.isActive() || (administrator.getRole() != PortalRole.MANAGER_ADMIN && administrator.getRole() != PortalRole.MANAGER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Manager or administrator access is required");
        }
        if (!target.isActive() || target.getRole() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only active users with an assigned role can be impersonated");
        }
        if (target.getId().equals(administrator.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You are already signed in as this user");
        }
        return issueToken(target, administrator.getId());
    }

    /**
     * Signs and issues a HMAC-SHA256 JWT for the specified user, encoding roles, department,
     * organizational group, and personal manager hierarchy into claims.
     */
    private TokenResponse issueToken(PortalUser user, UUID impersonatedBy) {
        Instant now = Instant.now();
        Instant expires = now.plus(ttlMinutes, ChronoUnit.MINUTES);
        List<String> rolesList = user.getRole() == PortalRole.MANAGER_ADMIN
                ? List.of("MANAGER_ADMIN", "MANAGER")
                : List.of(user.getRole().name());

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
                .claim("roles", rolesList);

        if (user.getDepartment() != null) {
            claimsBuilder.claim("department", user.getDepartment().name());
        }
        if (user.getOrgGroup() != null) {
            claimsBuilder.claim("org_group", user.getOrgGroup().name());
        }
        if (user.getManagerId() != null) {
            claimsBuilder.claim("manager_id", user.getManagerId().toString());
            if (user.getManagerName() != null) {
                claimsBuilder.claim("manager_name", user.getManagerName());
            }
        }
        if (impersonatedBy != null) {
            claimsBuilder.claim("impersonated_by", impersonatedBy.toString());
        }

        JwtClaimsSet claims = claimsBuilder.build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).keyId("northstar-hs256").build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", ttlMinutes * 60, authenticated(user));
    }

    /**
     * Retrieves the authenticated user profile for the current session.
     */
    @Transactional(readOnly = true)
    public AuthenticatedUser currentUser(UUID id) { return authenticated(findUser(id)); }

    /**
     * Updates an authenticated user's password.
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
     */
    @Transactional(readOnly = true)
    public List<UserSummary> listUsers() {
        return users.findAllByOrderByCreatedAtAsc().stream().map(AuthService::summary).toList();
    }

    /**
     * Lists all active managers and administrators eligible to be selected as approvers.
     */
    @Transactional(readOnly = true)
    public List<ApproverOption> listApprovers() {
        return users.findAllByRoleInAndActiveTrueOrderByFullNameAsc(List.of(PortalRole.MANAGER_ADMIN, PortalRole.MANAGER)).stream()
                .map(user -> new ApproverOption(user.getId(), user.getFullName())).toList();
    }

    /**
     * Lists all active managers and administrators eligible to be assigned as personal managers.
     */
    @Transactional(readOnly = true)
    public List<ManagerOption> listManagers() {
        return users.findAllByRoleInAndActiveTrueOrderByFullNameAsc(List.of(PortalRole.MANAGER_ADMIN, PortalRole.MANAGER)).stream()
                .map(u -> new ManagerOption(
                        u.getId(),
                        u.getEmployeeId(),
                        u.getUsername(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getRole(),
                        u.getDepartment(),
                        u.getOrgGroup()))
                .toList();
    }

    /**
     * Resolves the full reporting hierarchy (direct and indirect subordinates) for a personal manager.
     */
    @Transactional(readOnly = true)
    public List<SubordinateSummary> getReportingHierarchy(UUID managerId) {
        findUser(managerId); // Validate manager exists
        List<PortalUser> allUsers = users.findAll();
        Map<UUID, List<PortalUser>> reportsByManager = allUsers.stream()
                .filter(u -> u.getManagerId() != null)
                .collect(Collectors.groupingBy(PortalUser::getManagerId));

        List<SubordinateSummary> results = new ArrayList<>();
        Queue<UUID> queue = new ArrayDeque<>();
        queue.add(managerId);
        Set<UUID> visited = new HashSet<>();
        visited.add(managerId);

        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            List<PortalUser> directReports = reportsByManager.getOrDefault(current, List.of());
            for (PortalUser report : directReports) {
                if (visited.add(report.getId())) {
                    results.add(new SubordinateSummary(
                            report.getId(),
                            report.getEmployeeId(),
                            report.getUsername(),
                            report.getFullName(),
                            report.getEmail(),
                            report.getDepartment(),
                            report.getOrgGroup(),
                            report.getManagerId(),
                            report.getManagerName()));
                    queue.add(report.getId());
                }
            }
        }
        return results;
    }

    /**
     * Returns the list of subordinate user IDs in the reporting hierarchy of the given manager.
     */
    @Transactional(readOnly = true)
    public List<UUID> getSubordinateIds(UUID managerId) {
        return getReportingHierarchy(managerId).stream().map(SubordinateSummary::id).toList();
    }

    /**
     * Provisions a new user account directly by an administrator.
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
            user.setOrgGroup(input.orgGroup());
            if (input.managerId() != null) {
                PortalUser manager = users.findById(input.managerId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned manager does not exist"));
                if (!manager.isActive()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned manager must be an active user");
                }
                user.setManagerId(manager.getId());
                user.setManagerName(manager.getFullName());
            }
            PortalUser saved = users.save(user);
            String mgrUsername = (saved.getManagerId() != null) ? users.findById(saved.getManagerId()).map(PortalUser::getUsername).orElse(null) : null;
            String grp = saved.getOrgGroup() != null ? saved.getOrgGroup().name() : "GENERAL";
            serviceNowSyncClient.syncUserAsync(saved.getUsername(), saved.getFullName(), saved.getEmail(), grp, mgrUsername);
            return summary(saved);
        } catch (DataIntegrityViolationException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email, username, or employee ID already exists");
        }
    }

    /**
     * Updates an existing user's role and activates the account.
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
     * Updates an existing user's role, department, organizational group, and personal manager.
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

        // Validate manager assignment if provided
        if (assignment.managerId() != null) {
            validateNoCyclicReporting(id, assignment.managerId());
            PortalUser manager = users.findById(assignment.managerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned manager does not exist"));
            if (!manager.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned manager must be an active user");
            }
            user.setManagerId(manager.getId());
            user.setManagerName(manager.getFullName());
        } else {
            user.setManagerId(null);
            user.setManagerName(null);
        }

        user.setRole(assignment.role());
        user.setDepartment(assignment.department());
        user.setOrgGroup(assignment.orgGroup());
        user.setActive(true);
        PortalUser saved = users.save(user);
        String mgrUsername = (saved.getManagerId() != null) ? users.findById(saved.getManagerId()).map(PortalUser::getUsername).orElse(null) : null;
        String grp = saved.getOrgGroup() != null ? saved.getOrgGroup().name() : "GENERAL";
        serviceNowSyncClient.syncUserAsync(saved.getUsername(), saved.getFullName(), saved.getEmail(), grp, mgrUsername);
        return summary(saved);
    }

    /**
     * Verifies that assigning proposedManagerId as the manager for employeeId does not create a cycle.
     */
    private void validateNoCyclicReporting(UUID employeeId, UUID proposedManagerId) {
        if (employeeId.equals(proposedManagerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An employee cannot be assigned as their own manager");
        }
        UUID current = proposedManagerId;
        Set<UUID> visited = new HashSet<>();
        visited.add(employeeId);
        while (current != null) {
            if (!visited.add(current)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Circular reporting hierarchy detected");
            }
            PortalUser mgr = users.findById(current).orElse(null);
            if (mgr == null) break;
            current = mgr.getManagerId();
        }
    }

    /**
     * Helper to find user by ID or throw 404 NOT_FOUND.
     */
    public PortalUser findUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static void validatePasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
        }
    }

    private static UserSummary summary(PortalUser user) {
        return new UserSummary(
                user.getId(),
                user.getEmployeeId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getManagerId(),
                user.getManagerName(),
                user.getOrgGroup(),
                user.isActive(),
                user.getCreatedAt());
    }

    private static AuthenticatedUser authenticated(PortalUser user) {
        List<String> roles = user.getRole() == PortalRole.MANAGER_ADMIN
                ? List.of("MANAGER_ADMIN", "MANAGER")
                : List.of(user.getRole().name());
        return new AuthenticatedUser(
                user.getId(),
                user.getEmployeeId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getManagerId(),
                user.getManagerName(),
                user.getOrgGroup(),
                roles);
    }

    private String generateEmployeeId() {
        for (int i = 0; i < 15; i++) {
            String candidate = "EMP-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
            if (!users.existsByEmployeeIdIgnoreCase(candidate)) return candidate;
        }
        return "EMP-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
    }

    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }

    private static String deriveUsername(String email) {
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf('@')).trim().toLowerCase();
        }
        return "user_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
