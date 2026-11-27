package com.itsm.changemanagement.integration;

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
 * Client component for dispatching change requests to the ServiceNow integration boundary.
 *
 * <p><b>Purpose:</b> Communicates with {@code servicenow-integration} to synchronize change
 * requests directly with the external ServiceNow Cloud instance (creating a {@code change_request} record).
 */
@Component
public class ServiceNowChangeClient {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowChangeClient.class);
    private final RestClient restClient;

    public ServiceNowChangeClient(@Value("${SERVICENOW_INTEGRATION_URL:http://servicenow-integration:8089/integration}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Submits a change request payload to ServiceNow.
     *
     * @param payload Map containing change fields (short_description, description, justification, priority, category, etc.).
     * @return Map containing ServiceNow ticket attributes (number, sys_id), or {@code null} if integration fails.
     */
    public Map<String, Object> createChange(Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/changes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ServiceNow change creation skipped or failed (falling back to local): {}", ex.getMessage());
            return null;
        }
    }
}
