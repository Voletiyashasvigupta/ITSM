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

/**
 * Collection of data transfer records for authentication and identity administration.
 *
 * <p><b>Purpose:</b> Centralizes request and response schemas for user registration, login, token responses,
 * password modification, and administrative user provisioning.
 *
 * <p><b>Downstream / Workflow:</b> Validated by Spring Web validation annotations on controller endpoints,
 * passed into {@link com.northstar.auth.service.AuthService}, and serialized as JSON responses to the frontend.
 */
public final class AuthModels {
    private AuthModels() {}

    /** Input payload for self-service user registration. */
    public record RegisterInput(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String password) {}

    /** Input payload for user login authentication. */
    public record LoginInput(@NotBlank @Email @Size(max = 254) String email, @NotBlank String password) {}

    /** Input payload for changing account password. */
    public record PasswordChange(@NotBlank String currentPassword, @NotBlank @Size(min = 12, max = 72) String newPassword) {}

    /** Input payload for updating a user's security role. */
    public record RoleAssignment(@NotNull PortalRole role) {}

    /** Input payload for updating a user's role and department. */
    public record AccessAssignment(@NotNull PortalRole role, EmployeeDepartment department) {}

    /** Input payload for administrator-initiated user creation with predefined credentials. */
    public record AdminUserCreateInput(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String temporaryPassword,
            @NotNull PortalRole role,
            EmployeeDepartment department) {}

    /** Summary DTO of a portal user displayed in administrative listings. */
    public record UserSummary(UUID id, String fullName, String email, PortalRole role, EmployeeDepartment department, boolean active, Instant createdAt) {}

    /** Authenticated user identity and permission descriptor embedded in tokens and profile checks. */
    public record AuthenticatedUser(UUID id, String fullName, String email, PortalRole role, EmployeeDepartment department, List<String> roles) {}

    /** Lightweight user descriptor used for populating approver selection dropdowns. */
    public record ApproverOption(UUID id, String fullName) {}

    /** Successful login response returning a signed JWT access token and user identity. */
    public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds, AuthenticatedUser user) {}

    /** Response payload acknowledging registration submission. */
    public record RegistrationResponse(UUID id, String fullName, String email, String status, Instant createdAt) {}
}

