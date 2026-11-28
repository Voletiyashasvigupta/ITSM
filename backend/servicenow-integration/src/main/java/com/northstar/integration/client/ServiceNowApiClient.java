package com.northstar.integration.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.northstar.integration.config.ServiceNowProperties;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
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

/**
 * HTTP client component responsible for communicating with the external ServiceNow instance.
 *
 * <p><b>Purpose:</b> Acts as the sole authorized egress client to external ServiceNow REST APIs.
 * Supports two authentication strategies automatically selected at runtime:
 * <ul>
 *   <li><b>Basic Auth</b> – used when {@code SERVICENOW_USERNAME} and {@code SERVICENOW_PASSWORD}
 *       are supplied (required for ServiceNow PDIs where Bearer tokens are blocked by the
 *       "unscoped API" restriction).</li>
 *   <li><b>OAuth2 Bearer</b> – used in production environments where the ServiceNow OAuth
 *       Application Registry has the {@code client_credentials} grant enabled.</li>
 * </ul>
 * Also applies Resilience4j circuit breaking and exponential backoff retries.
 *
 * <p><b>Downstream / Workflow:</b> Called by {@link com.northstar.integration.controller.CatalogProxyController}
 * when requests arrive from the internal Catalog Service. Returns parsed JSON nodes containing ServiceNow catalog items.
 */
@Component
public class ServiceNowApiClient {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowApiClient.class);
    private final RestClient restClient;
    private final ServiceNowProperties properties;
    private final CircuitBreakerFactory<?, ?> circuitBreakers;
    private volatile Token cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    /**
     * Constructs the ServiceNowApiClient with necessary HTTP builder, configuration, and circuit breaker.
     *
     * <p><b>Purpose:</b> Dependency injection constructor for initializing HTTP and resilience components.
     *
     * <p><b>Downstream / Workflow:</b> Spring instantiates this bean at service startup.
     *
     * @param builder The RestClient builder.
     * @param properties Configuration properties for ServiceNow.
     * @param circuitBreakers Factory for creating Resilience4j circuit breakers.
     */
    public ServiceNowApiClient(RestClient.Builder builder, ServiceNowProperties properties, CircuitBreakerFactory<?, ?> circuitBreakers) {
        this.restClient = builder.build();
        this.properties = properties;
        this.circuitBreakers = circuitBreakers;
    }

    /**
     * Reads catalog items from ServiceNow wrapped in a circuit breaker and retry mechanism.
     *
     * <p><b>Purpose:</b> Entry method for querying ServiceNow catalog table items while protecting the system
     * against external service degradation or cascading failures.
     *
     * <p><b>Downstream / Workflow:</b> Enforces configuration check, wraps {@link #readCatalogWithRetry(int)}
     * in the "serviceNow" circuit breaker, and returns the catalog JSON or raises a 503 SERVICE_UNAVAILABLE error.
     *
     * @param limit Maximum number of records to retrieve.
     * @return JsonNode containing the array of catalog item records.
     */
    public List<Map<String, Object>> readCatalog(int limit) {
        requireConfiguration();
        return circuitBreakers.create("serviceNow").run(
                () -> readCatalogWithRetry(limit),
                failure -> {
                    log.error("ServiceNow catalog read failed: {}", failure.getMessage(), failure);
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow is temporarily unavailable");
                });
    }

    /**
     * Submits a new record to any specified table in ServiceNow Table API.
     *
     * <p><b>Purpose:</b> Creates a real ticket in ServiceNow (e.g. incident, problem, change_request, sc_req_item).
     *
     * @param table Target table name.
     * @param payload Attributes to store in ServiceNow.
     * @return Map containing ServiceNow ticket result (number, sys_id, state, sys_created_on, etc.).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> createRecord(String table, Map<String, Object> payload) {
        requireConfiguration();
        return circuitBreakers.create("serviceNow").run(
                () -> {
                    String authHeader = buildAuthorizationHeader();
                    Map<String, Object> body = restClient.post()
                            .uri(properties.baseUrl() + "/api/now/table/" + table)
                            .headers(headers -> headers.set("Authorization", authHeader))
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(payload)
                            .retrieve()
                            .body(new ParameterizedTypeReference<Map<String, Object>>() {});
                    if (body == null || !(body.get("result") instanceof Map<?, ?> result)) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ServiceNow " + table + " creation returned invalid payload");
                    }
                    return (Map<String, Object>) result;
                },
                failure -> {
                    log.error("ServiceNow {} creation failed: {}", table, failure.getMessage(), failure);
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow " + table + " creation failed");
                });
    }

    /**
     * Updates an existing record in ServiceNow via Table API PATCH.
     */
    public Map<String, Object> updateRecord(String table, String sysId, Map<String, Object> payload) {
        requireConfiguration();
        return circuitBreakers.create("serviceNow").run(
                () -> {
                    String authHeader = buildAuthorizationHeader();
                    Map<String, Object> body = restClient.patch()
                            .uri(properties.baseUrl() + "/api/now/table/" + table + "/" + sysId)
                            .headers(headers -> headers.set("Authorization", authHeader))
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(payload)
                            .retrieve()
                            .body(new ParameterizedTypeReference<Map<String, Object>>() {});
                    if (body == null || !(body.get("result") instanceof Map<?, ?> result)) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ServiceNow " + table + " update returned invalid payload");
                    }
                    return (Map<String, Object>) result;
                },
                failure -> {
                    log.error("ServiceNow {} update failed for {}: {}", table, sysId, failure.getMessage(), failure);
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow " + table + " update failed");
                });
    }

    /**
     * Retrieves an existing record from ServiceNow by table and sys_id.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getRecord(String table, String sysId) {
        requireConfiguration();
        return circuitBreakers.create("serviceNow").run(
                () -> {
                    String authHeader = buildAuthorizationHeader();
                    Map<String, Object> body = restClient.get()
                            .uri(properties.baseUrl() + "/api/now/table/" + table + "/" + sysId)
                            .headers(headers -> headers.set("Authorization", authHeader))
                            .retrieve()
                            .body(new ParameterizedTypeReference<Map<String, Object>>() {});
                    if (body == null || !(body.get("result") instanceof Map<?, ?> result)) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ServiceNow " + table + " record not found");
                    }
                    return (Map<String, Object>) result;
                },
                failure -> {
                    log.error("ServiceNow {} read failed for {}: {}", table, sysId, failure.getMessage(), failure);
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow " + table + " read failed");
                });
    }

    /**
     * Retrieves detailed catalog item metadata and variables from Service Catalog API or sc_cat_item table.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getCatalogItemDetails(String sysId) {
        requireConfiguration();
        return circuitBreakers.create("serviceNow").run(
                () -> {
                    String authHeader = buildAuthorizationHeader();
                    try {
                        Map<String, Object> body = restClient.get()
                                .uri(properties.baseUrl() + "/api/sn_sc/servicecatalog/items/" + sysId)
                                .headers(headers -> headers.set("Authorization", authHeader))
                                .retrieve()
                                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
                        if (body != null && body.get("result") instanceof Map<?, ?> result) {
                            return (Map<String, Object>) result;
                        }
                    } catch (Exception ex) {
                        log.debug("sn_sc API not available for item {}, falling back to sc_cat_item table: {}", sysId, ex.getMessage());
                    }
                    return getRecord("sc_cat_item", sysId);
                },
                failure -> {
                    log.error("ServiceNow catalog item read failed for {}: {}", sysId, failure.getMessage(), failure);
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow catalog item read failed");
                });
    }

    /**
     * Submits a new incident to the ServiceNow Table API with idempotency and default assignment group.
     */
    public Map<String, Object> createIncident(Map<String, Object> payload) {
        String correlationId = payload.get("correlation_id") != null ? String.valueOf(payload.get("correlation_id")).trim() : null;
        if (correlationId != null && !correlationId.isBlank()) {
            Map<String, Object> existing = getRecordByCorrelation("incident", correlationId);
            if (existing != null) {
                log.info("Returning existing ServiceNow incident for correlation_id: {}", correlationId);
                return existing;
            }
        }
        Map<String, Object> incidentPayload = new HashMap<>(payload);
        if (!incidentPayload.containsKey("assignment_group") || incidentPayload.get("assignment_group") == null) {
            // Default to Incident Management group (sys_id: 12a586cd0bb23200ecfd818393673a30)
            incidentPayload.put("assignment_group", "12a586cd0bb23200ecfd818393673a30");
        }
        return createRecord("incident", incidentPayload);
    }

    /**
     * Queries a ServiceNow table by correlation_id to enforce idempotency across retries.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getRecordByCorrelation(String table, String correlationId) {
        if (correlationId == null || correlationId.isBlank()) return null;
        try {
            String authHeader = buildAuthorizationHeader();
            Map<String, Object> body = restClient.get()
                    .uri(properties.baseUrl() + "/api/now/table/" + table + "?sysparm_query=correlation_id=" + correlationId + "&sysparm_limit=1")
                    .headers(headers -> headers.set("Authorization", authHeader))
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            if (body != null && body.get("result") instanceof List<?> list && !list.isEmpty()) {
                return (Map<String, Object>) list.get(0);
            }
        } catch (Exception ex) {
            log.debug("Correlation check failed for table {} key {}: {}", table, correlationId, ex.getMessage());
        }
        return null;
    }

    /**
     * Looks up an existing ServiceNow user by user_name in sys_user.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        try {
            String authHeader = buildAuthorizationHeader();
            Map<String, Object> body = restClient.get()
                    .uri(properties.baseUrl() + "/api/now/table/sys_user?sysparm_query=user_name=" + username.trim() + "&sysparm_limit=1")
                    .headers(headers -> headers.set("Authorization", authHeader))
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            if (body != null && body.get("result") instanceof List<?> list && !list.isEmpty()) {
                return (Map<String, Object>) list.get(0);
            }
        } catch (Exception ex) {
            log.debug("User lookup failed for username {}: {}", username, ex.getMessage());
        }
        return null;
    }

    /**
     * Submits a full catalog request workflow:
     * 1. Checks correlation_id to prevent duplicate creation on retry.
     * 2. Creates a ServiceNow parent catalog request (sc_request) with REQ number.
     * 3. Creates a ServiceNow catalog request item (sc_req_item) with RITM number linked to the parent request.
     * 4. Maps submitted answers to catalog variables in sc_item_option and links via sc_item_option_mtom.
     */
    public Map<String, Object> createRequest(Map<String, Object> payload) {
        String correlationId = payload.get("correlation_id") != null ? String.valueOf(payload.get("correlation_id")).trim() : null;
        if (correlationId != null && !correlationId.isBlank()) {
            Map<String, Object> existingReq = getRecordByCorrelation("sc_request", correlationId);
            if (existingReq != null) {
                log.info("Returning existing ServiceNow request for correlation_id: {}", correlationId);
                Map<String, Object> existingRitm = getRecordByCorrelation("sc_req_item", correlationId);
                Map<String, Object> combined = new HashMap<>(existingReq);
                combined.put("request_number", existingReq.get("number"));
                combined.put("request_sys_id", existingReq.get("sys_id"));
                if (existingRitm != null) {
                    combined.put("ritm_number", existingRitm.get("number"));
                    combined.put("ritm_sys_id", existingRitm.get("sys_id"));
                }
                return combined;
            }
        }

        Map<String, Object> combined = new HashMap<>();
        String reqSysId = null;
        String reqNumber = null;

        // Resolve requested_for to a valid ServiceNow sys_user sys_id
        String reqFor = null;
        Object rawReqFor = payload.get("requested_for");
        if (rawReqFor != null) {
            String val = String.valueOf(rawReqFor).trim();
            if (val.length() == 32 && val.matches("[0-9a-fA-F]+")) {
                reqFor = val;
            }
        }
        if (reqFor == null) {
            // Default to ServiceNow System Administrator sys_user sys_id
            reqFor = "6816f79cc0a8016401c5a33be04be441";
        }

        // Step 1: Create parent sc_request
        try {
            Map<String, Object> reqPayload = new HashMap<>();
            reqPayload.put("short_description", payload.getOrDefault("short_description", "Service Catalog Request"));
            reqPayload.put("description", payload.getOrDefault("description", ""));
            reqPayload.put("special_instructions", payload.getOrDefault("special_instructions", ""));
            reqPayload.put("requested_for", reqFor);
            if (correlationId != null) {
                reqPayload.put("correlation_id", correlationId);
            }
            Map<String, Object> reqResult = createRecord("sc_request", reqPayload);
            if (reqResult != null) {
                reqSysId = reqResult.get("sys_id") != null ? String.valueOf(reqResult.get("sys_id")) : null;
                reqNumber = reqResult.get("number") != null ? String.valueOf(reqResult.get("number")) : null;
                combined.put("request_number", reqNumber);
                combined.put("request_sys_id", reqSysId);
            }
        } catch (Exception ex) {
            log.warn("Failed to create parent sc_request, proceeding with sc_req_item creation: {}", ex.getMessage());
        }

        // Step 2: Create sc_req_item linked to parent sc_request
        Map<String, Object> ritmPayload = new HashMap<>(payload);
        if (reqSysId != null) {
            ritmPayload.put("request", reqSysId);
        }
        ritmPayload.put("requested_for", reqFor);
        if (correlationId != null) {
            ritmPayload.put("correlation_id", correlationId);
        }

        // Ensure cat_item is set to a valid ServiceNow sc_cat_item sys_id so Item and Workflow attach
        Object rawCatItem = payload.get("cat_item");
        String catItemSysId = null;
        if (rawCatItem != null) {
            String val = String.valueOf(rawCatItem).trim();
            if (val.length() == 32 && val.matches("[0-9a-fA-F]+")) {
                catItemSysId = val;
            }
        }
        if (catItemSysId == null) {
            // Default to Standard Laptop / Hardware Asset catalog item in ServiceNow (has active workflow)
            catItemSysId = "04b7e94b4f7b4200086eeed18110c7fd";
        }
        ritmPayload.put("cat_item", catItemSysId);

        Map<String, Object> ritmResult = createRecord("sc_req_item", ritmPayload);
        combined.putAll(ritmResult);

        String ritmNumber = ritmResult.get("number") != null ? String.valueOf(ritmResult.get("number")) : null;
        String ritmSysId = ritmResult.get("sys_id") != null ? String.valueOf(ritmResult.get("sys_id")) : null;
        combined.put("ritm_number", ritmNumber);
        combined.put("ritm_sys_id", ritmSysId);
        if (reqNumber != null) {
            combined.put("request_number", reqNumber);
            combined.put("number", reqNumber); // Primary reference is the REQ number
        } else {
            combined.put("number", ritmNumber);
        }
        if (ritmSysId != null) {
            combined.put("sys_id", ritmSysId);
        }

        // Step 3: Create sc_item_option and sc_item_option_mtom for submitted catalog variables
        Object varsObj = payload.get("variables");
        if (varsObj instanceof Map<?, ?> vars && ritmSysId != null) {
            for (Map.Entry<?, ?> entry : vars.entrySet()) {
                if (entry.getValue() != null && !String.valueOf(entry.getValue()).isBlank()) {
                    try {
                        Map<String, Object> opt = new HashMap<>();
                        opt.put("value", String.valueOf(entry.getValue()).trim());
                        Map<String, Object> optResult = createRecord("sc_item_option", opt);
                        if (optResult != null && optResult.get("sys_id") != null) {
                            String optSysId = String.valueOf(optResult.get("sys_id"));
                            Map<String, Object> mtom = new HashMap<>();
                            mtom.put("request_item", ritmSysId);
                            mtom.put("sc_item_option", optSysId);
                            createRecord("sc_item_option_mtom", mtom);
                        }
                    } catch (Exception ex) {
                        log.debug("Skipping sc_item_option creation for key {}: {}", entry.getKey(), ex.getMessage());
                    }
                }
            }
        }

        return combined;
    }

    /**
     * Submits a new problem to the ServiceNow Table API.
     */
    public Map<String, Object> createProblem(Map<String, Object> payload) {
        return createRecord("problem", payload);
    }

    /**
     * Submits a new change request to the ServiceNow Table API.
     */
    public Map<String, Object> createChange(Map<String, Object> payload) {
        return createRecord("change_request", payload);
    }

    /**
     * Executes the catalog fetch with up to 4 retry attempts and exponential backoff.
     *
     * <p><b>Purpose:</b> Provides resilience against transient network anomalies and upstream 5xx errors.
     *
     * <p><b>Downstream / Workflow:</b> Repeatedly invokes {@link #fetchCatalog(int)} until successful or retries
     * are exhausted, sleeping with exponential delay between attempts.
     *
     * @param limit Maximum number of records to retrieve.
     * @return List of catalog item maps retrieved from ServiceNow.
     */
    private List<Map<String, Object>> readCatalogWithRetry(int limit) {
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

    /**
     * Dispatches an authenticated GET request to the ServiceNow Table API.
     *
     * <p><b>Purpose:</b> Queries the {@code sc_cat_item} table using the most compatible auth strategy:
     * Basic Auth when username+password are configured (required for ServiceNow PDIs where the "unscoped API"
     * restriction blocks OAuth Bearer tokens), falling back to OAuth2 Bearer in production environments.
     *
     * <p><b>Downstream / Workflow:</b> Selects auth strategy via {@link #buildAuthorizationHeader()},
     * issues HTTP GET to the Table API, and extracts the {@code result} list of item maps.
     *
     * @param limit Query record limit.
     * @return List of catalog item attribute maps from the "result" field of the response.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchCatalog(int limit) {
        String authHeader = buildAuthorizationHeader();
        Map<String, Object> body = restClient.get()
                .uri(properties.baseUrl() + "/api/now/table/sc_cat_item?sysparm_fields=sys_id,name,short_description,category,active&sysparm_limit=" + limit + "&sysparm_query=active=true")
                .headers(headers -> headers.set("Authorization", authHeader))
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        if (body == null || !(body.get("result") instanceof List<?> result)) {
            return Collections.emptyList();
        }
        return (List<Map<String, Object>>) result;
    }

    /**
     * Builds the HTTP Authorization header value using the optimal strategy for this environment.
     *
     * <p><b>Purpose:</b> Selects Basic Auth for ServiceNow PDIs (where OAuth Bearer is blocked by the
     * "Access to unscoped API" restriction) or OAuth2 Bearer for production instances with client_credentials enabled.
     *
     * <p><b>Downstream / Workflow:</b> Called by {@link #fetchCatalog(int)} on every request. Basic Auth
     * credentials are Base64-encoded from {@code username:password}. OAuth path calls {@link #acquireToken()}.
     *
     * @return The full "Authorization: ..." header value string.
     */
    private String buildAuthorizationHeader() {
        if (properties.hasPasswordGrant()) {
            // Use Basic Auth for PDI environments — ServiceNow PDIs block Bearer tokens on unscoped REST APIs.
            String credentials = properties.username() + ":" + properties.password();
            String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
            return "Basic " + encoded;
        }
        // Production: use OAuth2 Bearer token (requires client_credentials grant enabled in Application Registry)
        Token token = acquireToken();
        return "Bearer " + token.accessToken();
    }

    /**
     * Obtains an OAuth2 access token via password or client_credentials grant, caching until 30s before expiry.
     *
     * <p><b>Purpose:</b> Manages OAuth2 token lifecycle for production ServiceNow instances.
     * Not used when Basic Auth is active (PDI environments).
     *
     * <p><b>Downstream / Workflow:</b> Checks in-memory cache; if expired, selects the appropriate grant
     * type, POSTs to {@code properties.tokenUri()}, caches the result, and returns it.
     *
     * @return A valid {@link Token} object.
     */
    private synchronized Token acquireToken() {
        Instant now = Instant.now();
        if (cachedToken != null && now.isBefore(tokenExpiresAt.minusSeconds(30))) {
            return cachedToken;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", properties.clientId());
        form.add("client_secret", properties.clientSecret());

        if (properties.hasPasswordGrant()) {
            form.add("grant_type", "password");
            form.add("username", properties.username());
            form.add("password", properties.password());
        } else {
            form.add("grant_type", "client_credentials");
        }

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

    /**
     * Asserts that ServiceNow credentials and URLs are configured.
     *
     * <p><b>Purpose:</b> Fails fast with HTTP 503 if the service has not been supplied with ServiceNow credentials.
     *
     * <p><b>Downstream / Workflow:</b> Evaluated before entering network call pathways.
     */
    private void requireConfiguration() {
        if (!properties.credentialsConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ServiceNow integration is not configured");
        }
    }

    /**
     * Data record representing the OAuth2 token payload returned by ServiceNow.
     *
     * <p><b>Purpose:</b> Deserializes the JSON token response containing the access token string, token type, and expiration seconds.
     *
     * <p><b>Downstream / Workflow:</b> Used internally by {@link #acquireToken()} and cached for Bearer authorization headers.
     *
     * @param accessToken The Bearer access token string.
     * @param tokenType The token type (usually "Bearer").
     * @param expiresIn Time to live in seconds.
     */
    public record Token(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("expires_in") long expiresIn) {}
}
