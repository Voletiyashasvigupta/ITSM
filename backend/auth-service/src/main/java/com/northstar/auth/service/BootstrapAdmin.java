package com.northstar.auth.service;

import com.northstar.auth.entity.EmployeeDepartment;
import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.repository.PortalUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final PortalUserRepository users;
    private final PasswordEncoder passwords;
    private final boolean seedDefaultUsers;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public BootstrapAdmin(PortalUserRepository users, PasswordEncoder passwords,
            @Value("${bootstrap.seed-default-users:true}") boolean seedDefaultUsers,
            @Value("${bootstrap.admin.email:admin@northstar.local}") String adminEmail,
            @Value("${bootstrap.admin.password:NorthstarLocal2026!}") String adminPassword,
            @Value("${bootstrap.admin.full-name:Northstar Administrator}") String adminName) {
        this.users = users;
        this.passwords = passwords;
        this.seedDefaultUsers = seedDefaultUsers;
        this.adminEmail = adminEmail.trim().toLowerCase();
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedDefaultUsers) {
            return;
        }

        // 1. Seed or update Administrator (MANAGER_ADMIN)
        seedUser(adminEmail, adminName, adminPassword, PortalRole.MANAGER_ADMIN, EmployeeDepartment.ADMINISTRATION);

        // 2. Seed or update Standard Employee (EMPLOYEE)
        seedUser("employee@northstar.local", "Portal Employee", "NorthstarLocal2026!", PortalRole.EMPLOYEE, EmployeeDepartment.IT);

        // 3. Seed or update Technical Analyst (MANAGER_ADMIN)
        seedUser("analyst@northstar.local", "Service Desk Analyst", "NorthstarLocal2026!", PortalRole.MANAGER_ADMIN, EmployeeDepartment.SOFTWARE_ENGINEERING);
    }

    private void seedUser(String email, String fullName, String rawPassword, PortalRole role, EmployeeDepartment dept) {
        if (email == null || email.isBlank() || rawPassword == null || rawPassword.length() < 12) {
            return;
        }
        String normalizedEmail = email.trim().toLowerCase();
        users.findByEmail(normalizedEmail).ifPresentOrElse(user -> {
            user.setPasswordHash(passwords.encode(rawPassword));
            user.setActive(true);
            user.setRole(role);
            if (user.getDepartment() == null && dept != null) {
                user.setDepartment(dept);
            }
            users.save(user);
        }, () -> {
            PortalUser newUser = new PortalUser(fullName, normalizedEmail, passwords.encode(rawPassword), role, true);
            if (dept != null) {
                newUser.setDepartment(dept);
            }
            users.save(newUser);
        });
    }
}
