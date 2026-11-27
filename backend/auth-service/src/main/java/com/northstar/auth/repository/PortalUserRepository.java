package com.northstar.auth.repository;

import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.entity.PortalRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link PortalUser} entities.
 *
 * <p><b>Purpose:</b> Provides direct CRUD and query methods against the {@code portal_users} table in MySQL.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.auth.service.AuthService} and
 * {@link com.northstar.auth.service.BootstrapAdmin} to execute lookup, existence, and listing queries.
 */
public interface PortalUserRepository extends JpaRepository<PortalUser, UUID> {

    /**
     * Finds a user by their unique email address.
     *
     * <p><b>Purpose:</b> Core lookup for login authentication and duplicate checks.
     *
     * <p><b>Downstream / Workflow:</b> Called during user authentication and registration workflows.
     *
     * @param email The email address to search.
     * @return Optional containing the user if found.
     */
    Optional<PortalUser> findByEmail(String email);

    /**
     * Checks if a user record with the specified email already exists.
     *
     * <p><b>Purpose:</b> Fast uniqueness validation during registration.
     *
     * <p><b>Downstream / Workflow:</b> Checked before saving a new user record.
     *
     * @param email The email to check.
     * @return {@code true} if an account exists with this email.
     */
    boolean existsByEmail(String email);

    /**
     * Retrieves all portal users ordered by account creation time ascending.
     *
     * <p><b>Purpose:</b> Populates the administrator user directory.
     *
     * <p><b>Downstream / Workflow:</b> Called by {@code AdminUsersController} to render user management tables.
     *
     * @return Ordered list of all registered users.
     */
    List<PortalUser> findAllByOrderByCreatedAtAsc();

    /**
     * Finds all active users assigned a specific security role, ordered by full name.
     *
     * <p><b>Purpose:</b> Looks up active users by role (e.g. eligible approvers or managers).
     *
     * <p><b>Downstream / Workflow:</b> Used to populate approver dropdowns and participant selectors.
     *
     * @param role The security role to filter by.
     * @return List of matching active users.
     */
    List<PortalUser> findAllByRoleAndActiveTrueOrderByFullNameAsc(PortalRole role);
}
