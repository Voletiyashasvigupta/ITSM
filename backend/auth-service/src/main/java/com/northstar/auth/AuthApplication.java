package com.northstar.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Main application entry point for the Northstar Authentication Service.
 *
 * <p><b>Purpose:</b> Manages employee identities, BCrypt credential verification, role-based authorization,
 * department assignments, and JWT token issuance for the entire Northstar platform. Owns the {@code northstar_auth} MySQL schema.
 *
 * <p><b>Downstream / Workflow:</b> Starts the service on port 8088, registers with Eureka as {@code AUTH-SERVICE},
 * runs Flyway/Hibernate schema initialization, and boots the BootstrapAdmin component to seed default administrative accounts.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class AuthApplication {

    /**
     * Bootstraps the Auth Service.
     *
     * <p><b>Purpose:</b> Launches the Spring Boot runtime environment and web container.
     *
     * <p><b>Downstream / Workflow:</b> Listens for login, registration, and user administration calls forwarded by the API Gateway.
     *
     * @param args Command-line startup arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
