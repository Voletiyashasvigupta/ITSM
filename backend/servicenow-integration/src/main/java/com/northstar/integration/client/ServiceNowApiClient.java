package com.northstar.integration.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.northstar.integration.config.ServiceNowProperties;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

/** The only HTTP client allowed to call the external ServiceNow instance. */
@Component
public class ServiceNowApiClient {
    private final RestClient restClient;
    private final ServiceNowProperties properties;
    private final CircuitBreakerFactory<?, ?> circuitBreakers;
    private volatile Token cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    public ServiceNowApiClient(RestClient.Builder builder, ServiceNowProperties properties, CircuitBreakerFactory<?, ?> circuitBreakers) {
        this.restClient = builder.build();
        this.properties = properties;
        this.circuitBreakers = circuitBreakers;
    }

    public JsonNode readCatalog(int limit) {
        requireConfiguration();
        return circuitBreakers.create("serviceNow").run(
                () -> readCatalogWithRetry(limit),
                failure -> { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow is temporarily unavailable"); });
    }

    private JsonNode readCatalogWithRetry(int limit) {
        RuntimeException lastFailure = null;
        for (int attempt = 0; attempt < 4; attempt++) {
            try {
                return fetchCatalog(limit);
            } catch (RestClientResponseException exception) {
                if (!exception.getStatusCode().is5xxServerError()) throw exception;
                lastFailure = exception;
            } catch (ResourceAccessException exception) {
                lastFailure = exception;
            }
            if (attempt < 3) {
                try {
                    Thread.sleep(200L << attempt);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow request was interrupted");
                }
            }
        }
        throw lastFailure == null ? new IllegalStateException("ServiceNow request failed") : lastFailure;
    }

    private JsonNode fetchCatalog(int limit) {
        Token token = acquireToken();
        JsonNode body = restClient.get()
                .uri(properties.baseUrl() + "/api/now/table/sc_cat_item?sysparm_fields=sys_id,name,short_description,category,active&sysparm_limit=" + limit)
                .headers(headers -> headers.setBearerAuth(token.accessToken()))
                .retrieve()
                .body(JsonNode.class);
        return body == null ? null : body.path("result");
    }

    private synchronized Token acquireToken() {
        Instant now = Instant.now();
        if (cachedToken != null && now.isBefore(tokenExpiresAt.minusSeconds(30))) {
            return cachedToken;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", properties.clientId());
        form.add("client_secret", properties.clientSecret());

        Token token = restClient.post()
                .uri(properties.tokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Token.class);
        if (token == null || token.accessToken() == null || token.accessToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ServiceNow OAuth returned no access token");
        }
        long expiresIn = token.expiresIn() > 0 ? token.expiresIn() : 300;
        cachedToken = token;
        tokenExpiresAt = now.plusSeconds(expiresIn);
        return cachedToken;
    }

    private void requireConfiguration() {
        if (!properties.credentialsConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow integration is not configured");
        }
    }

    public record Token(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("expires_in") long expiresIn) {}
}
