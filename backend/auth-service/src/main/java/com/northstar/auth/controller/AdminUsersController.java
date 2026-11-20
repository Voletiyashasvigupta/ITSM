package com.northstar.auth.controller;

import com.northstar.auth.dto.AuthModels.RoleAssignment;
import com.northstar.auth.dto.AuthModels.AccessAssignment;
import com.northstar.auth.dto.AuthModels.AdminUserCreateInput;
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

@RestController
@RequestMapping("/api/auth/admin/users")
@PreAuthorize("hasRole('MANAGER_ADMIN')")
public class AdminUsersController {
    private final AuthService auth;
    private final boolean impersonationEnabled;

    public AdminUsersController(AuthService auth,@Value("${portal.impersonation.enabled:false}") boolean impersonationEnabled) { this.auth = auth; this.impersonationEnabled=impersonationEnabled; }

    @GetMapping
    public List<UserSummary> users() { return auth.listUsers(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary createUser(@Valid @RequestBody AdminUserCreateInput input) { return auth.createUser(input); }

    @PostMapping("/{id}/impersonate")
    public TokenResponse impersonate(@PathVariable("id") UUID id,@AuthenticationPrincipal Jwt jwt) {
        if(!impersonationEnabled) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,"Local user testing is disabled");
        if(jwt.getClaims().containsKey("impersonated_by")) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,"End the current test session before switching users");
        return auth.impersonate(UUID.fromString(jwt.getSubject()),id);
    }

    @PutMapping("/{id}/role")
    public UserSummary assignRole(@PathVariable("id") UUID id, @Valid @RequestBody RoleAssignment assignment,
            @AuthenticationPrincipal Jwt jwt) {
        return auth.assignRole(id, assignment, UUID.fromString(jwt.getSubject()));
    }

    @PutMapping("/{id}/access")
    public UserSummary assignAccess(@PathVariable("id") UUID id, @Valid @RequestBody AccessAssignment assignment,
            @AuthenticationPrincipal Jwt jwt) {
        return auth.assignAccess(id, assignment, UUID.fromString(jwt.getSubject()));
    }
}
