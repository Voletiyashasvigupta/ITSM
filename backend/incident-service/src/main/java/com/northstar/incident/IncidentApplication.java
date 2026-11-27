package com.northstar.incident;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application entry point for the Northstar Incident Management microservice.
 *
 * <p><b>Purpose:</b> Manages employee IT issue reporting, severity categorization, support team assignments,
 * status lifecycle transitions, and ticket commenting.
 *
 * <p><b>Downstream / Workflow:</b> Starts the Spring Boot web application on port 8087, registers with Eureka
 * as {@code INCIDENT-SERVICE}, and exposes REST endpoints under {@code /api/incidents/**}.
 */
@SpringBootApplication
public class IncidentApplication {

    /**
     * Bootstraps the Incident Service.
     *
     * <p><b>Purpose:</b> Launches the embedded server and configures database repositories.
     *
     * <p><b>Downstream / Workflow:</b> Begins processing incident submission, query, and status change requests.
     *
     * @param args Command-line arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(IncidentApplication.class, args);
    }
}
