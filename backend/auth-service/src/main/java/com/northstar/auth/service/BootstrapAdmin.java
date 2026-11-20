package com.northstar.auth.service;

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
    private final String email;
    private final String password;
    private final String name;

    public BootstrapAdmin(PortalUserRepository users, PasswordEncoder passwords,
            @Value("${bootstrap.admin.email:}") String email,
            @Value("${bootstrap.admin.password:}") String password,
            @Value("${bootstrap.admin.full-name:Northstar Administrator}") String name) {
        this.users = users;
        this.passwords = passwords;
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.name = name;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() && password.isBlank()) return;
        if (email.isBlank() || password.length() < 12) {
            throw new IllegalStateException("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (at least 12 characters)");
        }
        if (!users.existsByEmail(email)) {
            users.save(new PortalUser(name, email, passwords.encode(password), PortalRole.MANAGER_ADMIN, true));
        }
    }
}
