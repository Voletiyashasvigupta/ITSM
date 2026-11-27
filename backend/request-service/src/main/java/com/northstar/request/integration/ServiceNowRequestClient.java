package com.northstar.request.integration;

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
 * Client component for dispatching service catalog request creations to the ServiceNow integration boundary.
 *
 * <p><b>Purpose:</b> Communicates with {@code servicenow-integration} to synchronize service requests
 * directly with the external ServiceNow Cloud instance (creating a {@code sc_req_item} ticket).
 */
@Component
public class ServiceNowRequestClient {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowRequestClient.class);
    private final RestClient restClient;

    public ServiceNowRequestClient(@Value("${SERVICENOW_INTEGRATION_URL:http://servicenow-integration:8089/integration}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Submits a request payload to ServiceNow.
     *
     * @param payload Map containing request fields (short_description, description, special_instructions).
     * @return Map containing ServiceNow ticket attributes (number, sys_id), or {@code null} if integration fails.
     */
    public Map<String, Object> createRequest(Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/requests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ServiceNow request creation skipped or failed (falling back to local): {}", ex.getMessage());
            return null;
        }
    }
}
