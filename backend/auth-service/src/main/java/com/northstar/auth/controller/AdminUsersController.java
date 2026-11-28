package com.northstar.auth.controller;

import com.northstar.auth.dto.AuthModels.RoleAssignment;
import com.northstar.auth.dto.AuthModels.AccessAssignment;
import com.northstar.auth.dto.AuthModels.AdminUserCreateInput;
import com.northstar.auth.dto.AuthModels.SubordinateSummary;
import com.northstar.auth.dto.AuthModels.UserSummary;
import com.northstar.auth.dto.AuthModels.TokenResponse;
import com.northstar.auth.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

/**
 * Administrative REST controller for managing portal users, role assignments, and testing impersonation.
 *
 * <p><b>Purpose:</b> Restricted to users with the {@code ROLE_MANAGER_ADMIN} authority. Provides endpoints to
 * list all registered users, create pre-configured users, grant/modify roles and departments, and start local impersonation sessions.
 *
 * <p><b>Downstream / Workflow:</b> Intercepts requests to {@code /api/auth/admin/users/**}, enforces method security
 * via {@code @PreAuthorize}, and delegates to {@link AuthService}.
 */
@RestController
@RequestMapping("/api/auth/admin/users")
@PreAuthorize("hasRole('MANAGER_ADMIN')")
public class AdminUsersController {
    private final AuthService auth;
    private final boolean impersonationEnabled;

    /**
     * Constructs the AdminUsersController.
     *
     * <p><b>Purpose:</b> Injects the AuthService and the impersonation configuration flag.
     *
     * <p><b>Downstream / Workflow:</b> Initialized on startup by Spring.
     *
     * @param auth The AuthService.
     * @param impersonationEnabled Flag indicating whether impersonation is enabled in this environment.
     */
    public AdminUsersController(AuthService auth,@Value("${portal.impersonation.enabled:false}") boolean impersonationEnabled) { this.auth = auth; this.impersonationEnabled=impersonationEnabled; }

    /**
     * Lists all registered portal users.
     *
     * <p><b>Purpose:</b> Fetches all users for the administrative directory.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#listUsers()}.
     *
     * @return List of UserSummary DTOs.
     */
    @GetMapping
    public List<UserSummary> users() { return auth.listUsers(); }

    /**
     * Retrieves the reporting hierarchy of subordinates for a specific manager.
     */
    @GetMapping("/{id}/subordinates")
    public List<SubordinateSummary> subordinates(@PathVariable("id") UUID id) {
        return auth.getReportingHierarchy(id);
    }

    /**
     * Creates an active portal user with predefined role and department.
     *
     * <p><b>Purpose:</b> Administrator user onboarding.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#createUser(AdminUserCreateInput)}. Returns HTTP 201 Created.
     *
     * @param input User creation payload.
     * @return Created UserSummary.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary createUser(@Valid @RequestBody AdminUserCreateInput input) { return auth.createUser(input); }

    /**
     * Generates a temporary impersonation JWT allowing a manager/admin to test the portal as another user.
     *
     * <p><b>Purpose:</b> Facilitates testing and troubleshooting without password resets.
     *
     * <p><b>Downstream / Workflow:</b> Verified against {@code impersonationEnabled} flag, calls {@link AuthService#impersonate(UUID, UUID)}.
     *
     * @param id Target user UUID to impersonate.
     * @param jwt Caller's JWT token.
     * @return TokenResponse containing impersonation JWT.
     */
    @PostMapping("/{id}/impersonate")
    public TokenResponse impersonate(@PathVariable("id") UUID id,@AuthenticationPrincipal Jwt jwt) {
        if(!impersonationEnabled) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,"Local user testing is disabled");
        if(jwt.getClaims().containsKey("impersonated_by")) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,"End the current test session before switching users");
        return auth.impersonate(UUID.fromString(jwt.getSubject()),id);
    }

    /**
     * Updates an existing user's role.
     *
     * <p><b>Purpose:</b> Assigns security role (e.g. promotes to MANAGER_ADMIN).
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#assignRole(UUID, RoleAssignment, UUID)}.
     *
     * @param id Target user UUID.
     * @param assignment Role assignment payload.
     * @param jwt Administrator's JWT.
     * @return Updated UserSummary.
     */
    @PutMapping("/{id}/role")
    public UserSummary assignRole(@PathVariable("id") UUID id, @Valid @RequestBody RoleAssignment assignment,
            @AuthenticationPrincipal Jwt jwt) {
        return auth.assignRole(id, assignment, UUID.fromString(jwt.getSubject()));
    }

    /**
     * Updates an existing user's role and department.
     *
     * <p><b>Purpose:</b> Configures organizational access tiers and department memberships.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#assignAccess(UUID, AccessAssignment, UUID)}.
     *
     * @param id Target user UUID.
     * @param assignment Access assignment payload.
     * @param jwt Administrator's JWT.
     * @return Updated UserSummary.
     */
    @PutMapping("/{id}/access")
    public UserSummary assignAccess(@PathVariable("id") UUID id, @Valid @RequestBody AccessAssignment assignment,
            @AuthenticationPrincipal Jwt jwt) {
        return auth.assignAccess(id, assignment, UUID.fromString(jwt.getSubject()));
    }
}
