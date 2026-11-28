package com.northstar.incident.integration;

import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Client component for dispatching incident operations to the ServiceNow integration boundary.
 *
 * <p><b>Purpose:</b> Communicates with {@code servicenow-integration} microservice to synchronize incident
 * tickets directly with the external ServiceNow Cloud instance.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.incident.service.LocalIncidentService}.
 * When a user logs an incident in the Northstar portal, this client forwards the incident details to ServiceNow.
 */
@Component
public class ServiceNowIncidentClient {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowIncidentClient.class);
    private final RestClient restClient;

    /**
     * Initializes the client with target integration endpoint and resilient timeouts.
     *
     * @param baseUrl Base URI of the integration microservice (default: {@code http://servicenow-integration:8089/integration}).
     */
    public ServiceNowIncidentClient(@Value("${SERVICENOW_INTEGRATION_URL:http://servicenow-integration:8089/integration}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Submits an incident payload to ServiceNow.
     *
     * <p><b>Purpose:</b> Dispatches {@code POST /incidents} to the integration gateway.
     *
     * <p><b>Downstream / Workflow:</b> ServiceNow creates the record in {@code incident} table and returns
     * metadata including the official ServiceNow incident number (e.g. {@code INC0010042}) and sys_id.
     *
     * @param payload Map containing incident fields (short_description, description, category, impact, urgency, caller_id).
     * @return Map containing ServiceNow ticket attributes, or {@code null} if integration fails.
     */
    public Map<String, Object> createIncident(Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/incidents")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ServiceNow incident creation skipped or failed (falling back to local): {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Retrieves an incident from ServiceNow by sys_id.
     */
    public Map<String, Object> getIncident(String sysId) {
        try {
            return restClient.get()
                    .uri("/incidents/" + sysId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ServiceNow incident lookup failed for {}: {}", sysId, ex.getMessage());
            return null;
        }
    }

    /**
     * Updates an incident in ServiceNow by sys_id.
     */
    public Map<String, Object> updateIncident(String sysId, Map<String, Object> payload) {
        try {
            return restClient.patch()
                    .uri("/incidents/" + sysId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ServiceNow incident update failed for {}: {}", sysId, ex.getMessage());
            return null;
        }
    }
}
