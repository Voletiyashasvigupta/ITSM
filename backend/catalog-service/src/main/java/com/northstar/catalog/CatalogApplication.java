package com.northstar.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Main application entry point for the Northstar Catalog Service.
 *
 * <p><b>Purpose:</b> Manages the corporate service catalog hierarchy, category classifications, and dynamic form
 * definitions for employee self-service. Uses OpenFeign to communicate with the ServiceNow Integration service
 * and caches catalog responses in Redis.
 *
 * <p><b>Downstream / Workflow:</b> Starts the Spring Boot web application, registers with Eureka as {@code CATALOG-SERVICE},
 * activates OpenFeign clients, and serves catalog and form schema queries to the API Gateway / Frontend.
 */
@SpringBootApplication
@EnableFeignClients
public class CatalogApplication {

    /**
     * Bootstraps the Catalog Service.
     *
     * <p><b>Purpose:</b> Initializes Spring application context and configuration.
     *
     * <p><b>Downstream / Workflow:</b> Starts embedded Tomcat on port 8081 to receive catalog requests.
     *
     * @param args Command-line arguments.
     */
    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }
}
