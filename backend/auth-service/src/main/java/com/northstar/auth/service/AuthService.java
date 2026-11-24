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

@Service
public class AuthService {
    private final PortalUserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final String audience;
    private final long ttlMinutes;
    private final boolean autoActivateRegistration;

    public AuthService(PortalUserRepository users, PasswordEncoder passwords, JwtEncoder jwtEncoder,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience,
            @Value("${security.jwt.ttl-minutes:60}") long ttlMinutes,
            @Value("${security.auth.auto-activate-registration:true}") boolean autoActivateRegistration) {
        this.users = users;
        this.passwords = passwords;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.audience = audience;
        this.ttlMinutes = ttlMinutes;
        this.autoActivateRegistration = autoActivateRegistration;
    }

    @Transactional
    public RegistrationResponse register(RegisterInput input) {
        String email = normalizeEmail(input.email());
        validatePasswordBytes(input.password());
        if (users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        try {
            PortalRole role = autoActivateRegistration ? PortalRole.EMPLOYEE : null;
            boolean active = autoActivateRegistration;
            PortalUser user = new PortalUser(input.fullName().trim(), email, passwords.encode(input.password()), role, active);
            if (autoActivateRegistration) {
                user.setDepartment(com.northstar.auth.entity.EmployeeDepartment.IT);
            }
            user = users.save(user);
            String status = autoActivateRegistration ? "ACTIVE" : "PENDING_ROLE_ASSIGNMENT";
            return new RegistrationResponse(user.getId(), user.getFullName(), user.getEmail(), status, user.getCreatedAt());
        } catch (DataIntegrityViolationException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
    }

    public TokenResponse login(LoginInput input) {
        PortalUser user = users.findByEmail(normalizeEmail(input.email())).orElse(null);
        if (user == null || !passwords.matches(input.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        }
        if (!user.isActive() || user.getRole() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is waiting for an administrator to assign access");
        }
        return issueToken(user,null);
    }

    @Transactional(readOnly = true)
    public TokenResponse impersonate(UUID administratorId,UUID targetId) {
        PortalUser administrator=findUser(administratorId);
        if(!administrator.isActive()||administrator.getRole()!=PortalRole.MANAGER_ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Manager or administrator access is required");
        PortalUser target=findUser(targetId);
        if(!target.isActive()||target.getRole()==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only active users with an assigned role can be impersonated");
        if(target.getId().equals(administrator.getId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"You are already signed in as this user");
        return issueToken(target,administrator.getId());
    }

    private TokenResponse issueToken(PortalUser user,UUID impersonatedBy) {
        Instant now = Instant.now();
        Instant expires = now.plus(ttlMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .audience(List.of(audience))
                .issuedAt(now)
                .expiresAt(expires)
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("roles", List.of(user.getRole().name()));
        if(impersonatedBy!=null) claimsBuilder.claim("impersonated_by",impersonatedBy.toString());
        JwtClaimsSet claims = claimsBuilder.build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).keyId("northstar-hs256").build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", ttlMinutes * 60, authenticated(user));
    }

    @Transactional(readOnly = true)
    public AuthenticatedUser currentUser(UUID id) { return authenticated(findUser(id)); }

    @Transactional
    public void changePassword(UUID id, PasswordChange change) {
        validatePasswordBytes(change.newPassword());
        PortalUser user = findUser(id);
        if (!passwords.matches(change.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwords.encode(change.newPassword()));
    }

    @Transactional(readOnly = true)
    public List<UserSummary> listUsers() {
        return users.findAllByOrderByCreatedAtAsc().stream().map(AuthService::summary).toList();
    }

    @Transactional(readOnly = true)
    public List<ApproverOption> listApprovers() {
        return users.findAllByRoleAndActiveTrueOrderByFullNameAsc(PortalRole.MANAGER_ADMIN).stream()
                .map(user -> new ApproverOption(user.getId(), user.getFullName())).toList();
    }

    @Transactional
    public UserSummary createUser(AdminUserCreateInput input) {
        String email = normalizeEmail(input.email());
        String fullName = input.fullName().trim();
        validatePasswordBytes(input.temporaryPassword());
        if (input.role() == PortalRole.EMPLOYEE && input.department() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a department for employee access");
        }
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        try {
            PortalUser user = new PortalUser(fullName, email, passwords.encode(input.temporaryPassword()), input.role(), true);
            user.setDepartment(input.department());
            return summary(users.save(user));
        } catch (DataIntegrityViolationException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
    }

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

    private PortalUser findUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }

    private static String normalizeEmail(String email) { return email.trim().toLowerCase(); }

    private static void validatePasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
        }
    }

    private static UserSummary summary(PortalUser user) {
        return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getDepartment(), user.isActive(), user.getCreatedAt());
    }

    private static AuthenticatedUser authenticated(PortalUser user) {
        return new AuthenticatedUser(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getDepartment(), List.of(user.getRole().name()));
    }
}
