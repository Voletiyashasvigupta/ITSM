package com.northstar.request;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application entry point for the Northstar Service Request microservice.
 *
 * <p><b>Purpose:</b> Manages employee service catalog requests, multi-level approvals, audit history logging,
 * transactional outbox event publishing, and asynchronous RabbitMQ relay. Owns the {@code northstar_request_service} MySQL schema.
 *
 * <p><b>Downstream / Workflow:</b> Starts the embedded web container on port 8082, registers with Eureka as {@code REQUEST-SERVICE},
 * runs Flyway migrations, and activates scheduled background tasks for outbox message relay.
 */
@SpringBootApplication
@EnableScheduling
public class RequestApplication {

    /**
     * Bootstraps the Request Service application.
     *
     * <p><b>Purpose:</b> Initializes Spring application context and scheduling engine.
     *
     * <p><b>Downstream / Workflow:</b> Begins listening for service request and approval transactions.
     *
     * @param args Command-line startup arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(RequestApplication.class, args);
    }
}
