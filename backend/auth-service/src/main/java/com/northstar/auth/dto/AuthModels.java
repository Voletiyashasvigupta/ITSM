package com.northstar.auth.dto;

import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.EmployeeDepartment;
import com.northstar.auth.entity.OrganizationalGroup;
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
 * password modification, and administrative user provisioning with support for organizational groups and
 * personal manager hierarchy.
 */
public final class AuthModels {
    private AuthModels() {}

    /** Input payload for self-service user registration. Registration requires work email and can include chosen username and employee ID. */
    public record RegisterInput(
            @NotBlank @Size(max = 120) String fullName,
            @Size(max = 60) String username,
            @Size(max = 32) String employeeId,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String password) {}

    /** Input payload for enterprise login authentication using corporate username or employee ID. */
    public record LoginInput(@NotBlank @Size(max = 120) String username, @NotBlank String password) {}

    /** Input payload for changing account password. */
    public record PasswordChange(@NotBlank String currentPassword, @NotBlank @Size(min = 12, max = 72) String newPassword) {}

    /** Input payload for updating a user's security role. */
    public record RoleAssignment(@NotNull PortalRole role) {}

    /** Input payload for updating a user's role, department, manager, and organizational group. */
    public record AccessAssignment(
            @NotNull PortalRole role,
            EmployeeDepartment department,
            UUID managerId,
            OrganizationalGroup orgGroup) {}

    /** Input payload for administrator-initiated user creation with predefined credentials. */
    public record AdminUserCreateInput(
            @NotBlank @Size(max = 120) String fullName,
            @Size(max = 60) String username,
            @Size(max = 32) String employeeId,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String temporaryPassword,
            @NotNull PortalRole role,
            EmployeeDepartment department,
            UUID managerId,
            OrganizationalGroup orgGroup) {}

    /** Summary DTO of a portal user displayed in administrative listings. */
    public record UserSummary(
            UUID id,
            String employeeId,
            String username,
            String fullName,
            String email,
            PortalRole role,
            EmployeeDepartment department,
            UUID managerId,
            String managerName,
            OrganizationalGroup orgGroup,
            boolean active,
            Instant createdAt) {}

    /** Authenticated user identity and permission descriptor embedded in tokens and profile checks. */
    public record AuthenticatedUser(
            UUID id,
            String employeeId,
            String username,
            String fullName,
            String email,
            PortalRole role,
            EmployeeDepartment department,
            UUID managerId,
            String managerName,
            OrganizationalGroup orgGroup,
            List<String> roles) {}

    /** Lightweight user descriptor used for populating approver selection dropdowns. */
    public record ApproverOption(UUID id, String fullName) {}

    /** Manager descriptor for populating personal manager selection dropdowns. */
    public record ManagerOption(
            UUID id,
            String employeeId,
            String username,
            String fullName,
            String email,
            PortalRole role,
            EmployeeDepartment department,
            OrganizationalGroup orgGroup) {}

    /** Subordinate descriptor in the reporting hierarchy. */
    public record SubordinateSummary(
            UUID id,
            String employeeId,
            String username,
            String fullName,
            String email,
            EmployeeDepartment department,
            OrganizationalGroup orgGroup,
            UUID managerId,
            String managerName) {}

    /** Successful login response returning a signed JWT access token and user identity. */
    public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds, AuthenticatedUser user) {}

    /** Response payload acknowledging registration submission. */
    public record RegistrationResponse(UUID id, String employeeId, String username, String fullName, String email, String status, Instant createdAt) {}
}
