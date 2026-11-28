package com.northstar.auth.repository;

import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.entity.PortalRole;
import java.util.Collection;
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
     * Finds a user by their unique corporate employee ID (e.g. EMP-10001, case-insensitive).
     *
     * @param employeeId The corporate employee identifier.
     * @return Optional containing the user if found.
     */
    Optional<PortalUser> findByEmployeeIdIgnoreCase(String employeeId);

    /**
     * Checks if a user record with the specified employee ID already exists (case-insensitive).
     *
     * @param employeeId The corporate employee identifier to check.
     * @return {@code true} if an account exists with this employee ID.
     */
    boolean existsByEmployeeIdIgnoreCase(String employeeId);

    /**
     * Finds a user by corporate username, employee ID, or email address (case-insensitive).
     *
     * @param username Corporate username.
     * @param employeeId Corporate employee identifier.
     * @param email Corporate email address.
     * @return Optional containing the user if found.
     */
    Optional<PortalUser> findByUsernameIgnoreCaseOrEmployeeIdIgnoreCaseOrEmailIgnoreCase(String username, String employeeId, String email);

    /**
     * Finds a user by their unique corporate login username (case-insensitive).
     *
     * @param username The corporate username.
     * @return Optional containing the user if found.
     */
    Optional<PortalUser> findByUsernameIgnoreCase(String username);

    /**
     * Checks if a user record with the specified username already exists (case-insensitive).
     *
     * @param username The username to check.
     * @return {@code true} if an account exists with this username.
     */
    boolean existsByUsernameIgnoreCase(String username);

    /**
     * Finds a user by corporate username or corporate email (case-insensitive).
     *
     * @param username Corporate username.
     * @param email Corporate email address.
     * @return Optional containing the user if found.
     */
    Optional<PortalUser> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    /**
     * Finds a user by their unique email address.
     *
     * @param email The email address to search.
     * @return Optional containing the user if found.
     */
    Optional<PortalUser> findByEmail(String email);

    /**
     * Checks if a user record with the specified email already exists.
     *
     * @param email The email to check.
     * @return {@code true} if an account exists with this email.
     */
    boolean existsByEmail(String email);

    /**
     * Retrieves all portal users ordered by account creation time ascending.
     *
     * @return Ordered list of all registered users.
     */
    List<PortalUser> findAllByOrderByCreatedAtAsc();

    /**
     * Finds all active users assigned a specific security role, ordered by full name.
     *
     * @param role The security role to filter by.
     * @return List of matching active users.
     */
    List<PortalUser> findAllByRoleAndActiveTrueOrderByFullNameAsc(PortalRole role);

    /**
     * Finds all active users assigned any of the specified roles, ordered by full name.
     *
     * @param roles Collection of security roles.
     * @return List of matching active users.
     */
    List<PortalUser> findAllByRoleInAndActiveTrueOrderByFullNameAsc(Collection<PortalRole> roles);

    /**
     * Finds all direct reports for a given personal manager.
     *
     * @param managerId UUID of the personal manager.
     * @return List of users directly assigned to this manager.
     */
    List<PortalUser> findAllByManagerId(UUID managerId);
}
