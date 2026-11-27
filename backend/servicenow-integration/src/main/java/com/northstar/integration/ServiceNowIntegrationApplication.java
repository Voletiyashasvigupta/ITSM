package com.northstar.integration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Main application entry point for the ServiceNow Integration microservice.
 *
 * <p><b>Purpose:</b> Acts as the secure, isolated integration boundary between the internal Northstar
 * microservices and the external ServiceNow instance. Encapsulates OAuth2 client credentials flows,
 * resilience policies (circuit breakers and exponential backoff retries), and REST proxies.
 *
 * <p><b>Downstream / Workflow:</b> Starts the Spring Boot web application, registers with Eureka as
 * {@code SERVICENOW-INTEGRATION}, and exposes REST endpoints for internal services (such as Catalog Service)
 * to communicate with ServiceNow.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class ServiceNowIntegrationApplication {

    /**
     * Bootstraps and runs the ServiceNow Integration service.
     *
     * <p><b>Purpose:</b> Initializes the Spring application context, binds ServiceNow configuration properties,
     * and activates HTTP clients and circuit breakers.
     *
     * <p><b>Downstream / Workflow:</b> Begins listening on port 8089 to process incoming proxy requests.
     *
     * @param args Command-line startup arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(ServiceNowIntegrationApplication.class, args);
    }
}
