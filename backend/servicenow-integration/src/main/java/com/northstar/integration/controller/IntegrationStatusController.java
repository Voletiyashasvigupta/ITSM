package com.northstar.integration.controller;

import com.northstar.integration.config.ServiceNowProperties;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/integration")
public class IntegrationStatusController {
    private final ServiceNowProperties properties;

    public IntegrationStatusController(ServiceNowProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/status")
    public IntegrationStatus status() {
        return new IntegrationStatus("servicenow", properties.credentialsConfigured(), Instant.now());
    }

    public record IntegrationStatus(String provider, boolean configured, Instant checkedAt) {}
}
