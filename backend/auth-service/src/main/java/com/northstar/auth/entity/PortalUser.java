package com.northstar.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a registered portal user within the {@code northstar_auth} database schema.
 *
 * <p><b>Purpose:</b> Persists core identity records, BCrypt password hashes, assigned roles, departments,
 * activation status, and creation timestamps in the {@code portal_users} table.
 *
 * <p><b>Downstream / Workflow:</b> Managed by {@link com.northstar.auth.repository.PortalUserRepository} and queried
 * by {@link com.northstar.auth.service.AuthService} during registration, login, and user management operations.
 */
@Entity
@Table(name = "portal_users")
public class PortalUser {
    @Id
    private UUID id;

    @Column(name = "employee_id", unique = true, length = 32)
    private String employeeId;

    @Column(name = "username", nullable = false, unique = true, length = 60)
    private String username;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private PortalRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "department", length = 40)
    private EmployeeDepartment department;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Protected no-arg constructor required by JPA specification.
     */
    protected PortalUser() {}

    /**
     * Comprehensive constructor for instantiating new portal user records with employee ID.
     *
     * @param employeeId Corporate employee identifier (e.g. EMP-10001).
     * @param username Unique corporate login username.
     * @param fullName User's full name.
     * @param email Corporate email address.
     * @param passwordHash BCrypt-hashed password.
     * @param role Assigned portal security role.
     * @param active Account activation status.
     */
    public PortalUser(String employeeId, String username, String fullName, String email, String passwordHash, PortalRole role, boolean active) {
        this.id = UUID.randomUUID();
        this.employeeId = (employeeId != null && !employeeId.isBlank()) ? employeeId.trim().toUpperCase() : deriveEmployeeId();
        this.username = (username != null && !username.isBlank()) ? username.trim().toLowerCase() : deriveUsername(email);
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
    }

    /**
     * Convenience constructor for instantiating new portal user records.
     *
     * <p><b>Purpose:</b> Creates a new user entity with a generated UUID, username, credentials, role, and activation flag.
     *
     * <p><b>Downstream / Workflow:</b> Called by registration and administrator bootstrap services.
     *
     * @param username Unique corporate login username.
     * @param fullName User's full name.
     * @param email Corporate email address.
     * @param passwordHash BCrypt-hashed password.
     * @param role Assigned portal security role.
     * @param active Account activation status.
     */
    public PortalUser(String username, String fullName, String email, String passwordHash, PortalRole role, boolean active) {
        this(null, username, fullName, email, passwordHash, role, active);
    }

    /**
     * Legacy constructor deriving username from corporate email prefix.
     */
    public PortalUser(String fullName, String email, String passwordHash, PortalRole role, boolean active) {
        this(null, deriveUsername(email), fullName, email, passwordHash, role, active);
    }

    private static String deriveUsername(String email) {
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf('@')).trim().toLowerCase();
        }
        return "user_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String deriveEmployeeId() {
        return "EMP-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
    }

    /**
     * JPA lifecycle callback executed prior to entity insertion.
     *
     * <p><b>Purpose:</b> Guarantees a valid UUID, employee ID, username, and creation timestamp are populated before database insert.
     *
     * <p><b>Downstream / Workflow:</b> Executed automatically by Hibernate during persistence.
     */
    @PrePersist
    void beforeInsert() {
        if (id == null) id = UUID.randomUUID();
        if (employeeId == null || employeeId.isBlank()) employeeId = deriveEmployeeId();
        if (username == null || username.isBlank()) username = deriveUsername(email);
        if (createdAt == null) createdAt = Instant.now();
    }

    /** @return User's unique UUID. */
    public UUID getId() { return id; }

    /** @return Corporate employee ID (e.g. EMP-10001). */
    public String getEmployeeId() { return employeeId; }

    /** @return Unique corporate login username. */
    public String getUsername() { return username; }

    /** @return User's full display name. */
    public String getFullName() { return fullName; }

    /** @return User's unique login email. */
    public String getEmail() { return email; }

    /** @return BCrypt password hash. */
    public String getPasswordHash() { return passwordHash; }

    /** @return User's assigned portal role. */
    public PortalRole getRole() { return role; }

    /** @return User's business department. */
    public EmployeeDepartment getDepartment() { return department; }

    /** @return {@code true} if account is active and allowed to authenticate. */
    public boolean isActive() { return active; }

    /** @return Timestamp when the user was created. */
    public Instant getCreatedAt() { return createdAt; }

    /** @param employeeId Corporate employee identifier. */
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId != null ? employeeId.trim().toUpperCase() : null; }

    /** @param username New unique login username. */
    public void setUsername(String username) { this.username = username != null ? username.trim().toLowerCase() : null; }

    /** @param role New portal security role. */
    public void setRole(PortalRole role) { this.role = role; }

    /** @param department Assigned business department. */
    public void setDepartment(EmployeeDepartment department) { this.department = department; }

    /** @param active Activation flag. */
    public void setActive(boolean active) { this.active = active; }

    /** @param passwordHash New BCrypt password hash. */
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
