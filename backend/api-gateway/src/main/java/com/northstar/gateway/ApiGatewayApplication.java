package com.northstar.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application entry point for the Northstar API Gateway.
 *
 * <p><b>Purpose:</b> Serves as the single unified entry point for all frontend client traffic,
 * providing routing, cross-cutting security enforcement, JWT validation, and identity header propagation
 * across backend microservices.
 *
 * <p><b>Downstream / Workflow:</b> Starts the Spring Cloud Gateway reactive engine (Netty), registers
 * with Eureka, and intercepts all incoming HTTP requests to route them to target microservices based on
 * route configuration.
 */
@SpringBootApplication
public class ApiGatewayApplication {

    /**
     * Bootstraps and starts the API Gateway application.
     *
     * <p><b>Purpose:</b> Initializes Spring WebFlux reactive environment, route definitions, and security filter chains.
     *
     * <p><b>Downstream / Workflow:</b> Binds to port 8080 (or 7777 in local profile) and begins processing incoming API requests.
     *
     * @param args Command-line arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
