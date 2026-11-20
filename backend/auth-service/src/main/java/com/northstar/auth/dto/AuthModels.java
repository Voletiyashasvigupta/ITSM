package com.northstar.auth.dto;

import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.EmployeeDepartment;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AuthModels {
    private AuthModels() {}

    public record RegisterInput(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String password) {}

    public record LoginInput(@NotBlank @Email @Size(max = 254) String email, @NotBlank String password) {}

    public record PasswordChange(@NotBlank String currentPassword, @NotBlank @Size(min = 12, max = 72) String newPassword) {}

    public record RoleAssignment(@NotNull PortalRole role) {}

    public record AccessAssignment(@NotNull PortalRole role, EmployeeDepartment department) {}

    public record AdminUserCreateInput(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String temporaryPassword,
            @NotNull PortalRole role,
            EmployeeDepartment department) {}

    public record UserSummary(UUID id, String fullName, String email, PortalRole role, EmployeeDepartment department, boolean active, Instant createdAt) {}

    public record AuthenticatedUser(UUID id, String fullName, String email, PortalRole role, EmployeeDepartment department, List<String> roles) {}

    public record ApproverOption(UUID id, String fullName) {}

    public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds, AuthenticatedUser user) {}

    public record RegistrationResponse(UUID id, String fullName, String email, String status, Instant createdAt) {}
}

