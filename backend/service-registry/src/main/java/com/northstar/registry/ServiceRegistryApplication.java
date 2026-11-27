package com.northstar.registry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Main entry point for the Eureka Service Registry.
 *
 * <p><b>Purpose:</b> Acts as the central discovery server for all Northstar microservices
 * (API Gateway, Auth Service, Catalog Service, Request Service, etc.), allowing services
 * to dynamically locate and communicate with each other without hardcoded hostnames and ports.
 *
 * <p><b>Downstream / Workflow:</b> Once booted, downstream microservices register their network
 * locations (IP, port, health state) with this server. The API Gateway then queries this registry
 * to route incoming HTTP client traffic to live service instances.
 */
@SpringBootApplication
@EnableEurekaServer
public class ServiceRegistryApplication {

    /**
     * Bootstraps and launches the Eureka Service Registry Spring Boot application.
     *
     * <p><b>Purpose:</b> Initializes the Spring ApplicationContext and starts the embedded HTTP
     * server on port 8761 to begin listening for heartbeats and registration events.
     *
     * <p><b>Downstream / Workflow:</b> After initialization, control yields to the embedded servlet
     * container, making the Eureka dashboard and REST registration endpoints available to microservices.
     *
     * @param args Command-line arguments passed during startup.
     */
    public static void main(String[] args) {
        SpringApplication.run(ServiceRegistryApplication.class, args);
    }
}
