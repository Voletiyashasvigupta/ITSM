package com.northstar.auth.integration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Client for synchronizing registered and updated portal users with ServiceNow.
 */
@Component
public class ServiceNowUserSyncClient {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowUserSyncClient.class);
    private final RestClient restClient;

    public ServiceNowUserSyncClient(@Value("${SERVICENOW_INTEGRATION_URL:http://servicenow-integration:8089/integration}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Asynchronously provisions a registered or updated user in ServiceNow sys_user and sys_user_grmember.
     */
    public void syncUserAsync(String username, String fullName, String email, String orgGroup, String managerUsername) {
        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> payload = Map.of(
                        "username", username,
                        "fullName", fullName != null ? fullName : username,
                        "email", email != null ? email : "",
                        "orgGroup", orgGroup != null ? orgGroup : "GENERAL",
                        "managerUsername", managerUsername != null ? managerUsername : ""
                );
                Map<String, Object> resp = restClient.post()
                        .uri("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(payload)
                        .retrieve()
                        .body(new ParameterizedTypeReference<Map<String, Object>>() {});
                log.info("ServiceNow user sync succeeded for {}: {}", username, resp);
            } catch (Exception ex) {
                log.warn("Could not sync user {} to ServiceNow (non-blocking): {}", username, ex.getMessage());
            }
        });
    }
}
