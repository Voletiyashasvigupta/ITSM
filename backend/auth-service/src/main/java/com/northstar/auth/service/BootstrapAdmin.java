package com.northstar.auth.service;

import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.repository.PortalUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Startup component that seeds or updates the primary bootstrap administrator account.
 *
 * <p><b>Purpose:</b> Guarantees an initial active administrator exists on service startup when
 * {@code BOOTSTRAP_ADMIN_EMAIL} and {@code BOOTSTRAP_ADMIN_PASSWORD} environment variables are configured.
 *
 * <p><b>Downstream / Workflow:</b> Implements {@link ApplicationRunner}. Executed by Spring Boot once
 * the ApplicationContext is loaded, verifying or creating the admin user in the MySQL database before
 * incoming traffic is served.
 */
@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final PortalUserRepository users;
    private final PasswordEncoder passwords;
    private final String username;
    private final String email;
    private final String password;
    private final String name;

    /**
     * Constructs the BootstrapAdmin runner with user repository, password encoder, and bootstrap configurations.
     *
     * <p><b>Purpose:</b> Injects dependencies and configuration properties.
     *
     * <p><b>Downstream / Workflow:</b> Initialized during context startup.
     *
     * @param users The PortalUserRepository.
     * @param passwords BCrypt password encoder.
     * @param username Admin username configured via {@code bootstrap.admin.username}.
     * @param email Admin email configured via {@code bootstrap.admin.email}.
     * @param password Admin password configured via {@code bootstrap.admin.password}.
     * @param name Admin display name configured via {@code bootstrap.admin.full-name}.
     */
    public BootstrapAdmin(PortalUserRepository users, PasswordEncoder passwords,
            @Value("${bootstrap.admin.username:admin}") String username,
            @Value("${bootstrap.admin.email:}") String email,
            @Value("${bootstrap.admin.password:}") String password,
            @Value("${bootstrap.admin.full-name:Northstar Administrator}") String name) {
        this.users = users;
        this.passwords = passwords;
        this.username = (username != null && !username.isBlank()) ? username.trim().toLowerCase() : "admin";
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.name = name;
    }

    /**
     * Seeds or updates the bootstrap administrator account in the database.
     *
     * <p><b>Purpose:</b> Validates password complexity (min 12 chars), hashes the password with BCrypt,
     * sets corporate username, and sets role to {@link PortalRole#MANAGER_ADMIN} and active status to true.
     *
     * <p><b>Downstream / Workflow:</b> Saves the record in {@link PortalUserRepository}, enabling immediate admin login.
     *
     * @param args Startup application arguments.
     */
    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() && password.isBlank()) return;
        if (email.isBlank() || password.length() < 12) {
            throw new IllegalStateException("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (at least 12 characters)");
        }
        users.findByEmail(email).or(() -> users.findByUsernameIgnoreCase(username)).ifPresentOrElse(user -> {
            if (user.getUsername() == null || user.getUsername().isBlank()) {
                user.setUsername(username);
            }
            if (user.getEmployeeId() == null || user.getEmployeeId().isBlank()) {
                user.setEmployeeId("EMP-00001");
            }
            user.setPasswordHash(passwords.encode(password));
            user.setActive(true);
            user.setRole(PortalRole.MANAGER_ADMIN);
            users.save(user);
        }, () -> {
            users.save(new PortalUser("EMP-00001", username, name, email, passwords.encode(password), PortalRole.MANAGER_ADMIN, true));
        });
    }
}
