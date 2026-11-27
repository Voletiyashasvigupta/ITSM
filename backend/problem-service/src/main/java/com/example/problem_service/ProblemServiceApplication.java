package com.example.problem_service;

import org.springframework.boot.SpringApplication;

import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application entry point for the Northstar Problem Management microservice.
 *
 * <p><b>Purpose:</b> Manages root-cause investigations, known error records, problem states, and workarounds
 * for recurring incidents in the IT service ecosystem.
 *
 * <p><b>Downstream / Workflow:</b> Starts the Spring Boot web application, registers with Eureka as
 * {@code PROBLEM-SERVICE}, and serves REST endpoints under {@code /api/problems/**}.
 */
@SpringBootApplication
public class ProblemServiceApplication {

    /**
     * Bootstraps the Problem Management Service.
     *
     * <p><b>Purpose:</b> Launches the embedded application context and initializes database access.
     *
     * <p><b>Downstream / Workflow:</b> Listens for problem creation, investigation, and resolution requests.
     *
     * @param args Startup arguments.
     */
	public static void main(String[] args) {
		SpringApplication.run(ProblemServiceApplication.class, args);
	}

}
