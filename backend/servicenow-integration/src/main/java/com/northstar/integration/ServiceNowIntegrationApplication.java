package com.northstar.integration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ServiceNowIntegrationApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceNowIntegrationApplication.class, args);
    }
}
