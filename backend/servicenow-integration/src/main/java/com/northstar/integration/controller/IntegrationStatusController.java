package com.northstar.integration.controller;

import com.northstar.integration.config.ServiceNowProperties;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for health and readiness status of the ServiceNow integration boundary.
 *
 * <p><b>Purpose:</b> Reports whether external ServiceNow credentials and configuration settings
 * are populated without performing a live external ping or disclosing secrets.
 *
 * <p><b>Downstream / Workflow:</b> Queried by the API Gateway (under {@code /api/integration/status})
 * and administrative dashboards to monitor integration readiness.
 */
@RestController
@RequestMapping("/integration")
public class IntegrationStatusController {
    private final ServiceNowProperties properties;

    /**
     * Constructs the IntegrationStatusController.
     *
     * <p><b>Purpose:</b> Injects the ServiceNowProperties configuration bean.
     *
     * <p><b>Downstream / Workflow:</b> Spring initializes this controller during application bootstrap.
     *
     * @param properties Configuration properties to inspect.
     */
    public IntegrationStatusController(ServiceNowProperties properties) {
        this.properties = properties;
    }

    /**
     * Retrieves the current configuration status of the ServiceNow provider.
     *
     * <p><b>Purpose:</b> Checks if required credentials (URL, client ID/secret, token URI) are set.
     *
     * <p><b>Downstream / Workflow:</b> Returns an {@link IntegrationStatus} record containing provider name,
     * boolean configured flag, and check timestamp.
     *
     * @return Status report indicating whether ServiceNow integration is configured.
     */
    @GetMapping("/status")
    public IntegrationStatus status() {
        return new IntegrationStatus("servicenow", properties.credentialsConfigured(), Instant.now());
    }

    /**
     * Response record encapsulating the integration configuration health check.
     *
     * <p><b>Purpose:</b> DTO returned to status clients.
     *
     * <p><b>Downstream / Workflow:</b> Serialized as JSON in the HTTP response.
     *
     * @param provider Name of the integration provider ("servicenow").
     * @param configured {@code true} if all credentials are present.
     * @param checkedAt Timestamp when the check was performed.
     */
    public record IntegrationStatus(String provider, boolean configured, Instant checkedAt) {}
}
