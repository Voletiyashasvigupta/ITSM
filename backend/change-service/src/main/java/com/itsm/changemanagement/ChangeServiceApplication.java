package com.itsm.changemanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application entry point for the ITIL Change Management microservice.
 *
 * <p><b>Purpose:</b> Manages the Change Enablement lifecycle: RFC intake, risk assessment, CAB approvals,
 * implementation scheduling, PIR (Post Implementation Review), rollbacks, and audit histories.
 *
 * <p><b>Downstream / Workflow:</b> Starts embedded web server, registers with Eureka as {@code CHANGE-SERVICE},
 * and serves endpoints under {@code /api/changes/**}.
 */
@SpringBootApplication
public class ChangeServiceApplication {

    /**
     * Bootstraps the Change Management Service.
     *
     * <p><b>Purpose:</b> Launches Spring Boot application context and initializes Hibernate/MySQL connection.
     *
     * <p><b>Downstream / Workflow:</b> Begins listening for Change Management requests.
     *
     * @param args Command-line arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(ChangeServiceApplication.class, args);
    }
}
