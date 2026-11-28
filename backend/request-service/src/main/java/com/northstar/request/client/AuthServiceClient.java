package com.northstar.request.client;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
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
 * Client for communicating with the internal endpoints of the Authentication Service.
 *
 * <p><b>Purpose:</b> Resolves personal managers and subordinate reporting hierarchy for employees
 * to enforce organizational scoping and approval authorization rules.
 */
@Component
public class AuthServiceClient {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceClient.class);
    private final RestClient restClient;

    public AuthServiceClient(@Value("${AUTH_SERVICE_URL:http://auth-service:8088}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Retrieves the list of subordinate user IDs in the reporting hierarchy of the given manager.
     *
     * @param managerId UUID string of the manager.
     * @return List of subordinate UUID strings.
     */
    public List<String> getSubordinateIds(String managerId) {
        if (managerId == null || managerId.isBlank()) return Collections.emptyList();
        try {
            List<String> ids = restClient.get()
                    .uri("/api/auth/internal/users/{id}/subordinate-ids", managerId.trim())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<String>>() {});
            return ids != null ? ids : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("Failed to retrieve subordinates for manager {}: {}", managerId, ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Checks if the target employee is within the reporting hierarchy of the manager.
     *
     * @param managerId UUID string of the manager.
     * @param employeeId UUID string of the employee.
     * @return {@code true} if employee is a subordinate.
     */
    public boolean isSubordinate(String managerId, String employeeId) {
        if (managerId == null || employeeId == null) return false;
        if (managerId.equals(employeeId)) return false;
        List<String> subs = getSubordinateIds(managerId);
        return subs.contains(employeeId);
    }

    /**
     * Resolves the assigned personal manager ID for an employee.
     *
     * @param employeeId UUID string of the employee.
     * @return UUID string of the personal manager, or {@code null} if none assigned.
     */
    public String getPersonalManagerId(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) return null;
        try {
            Map<String, Object> user = restClient.get()
                    .uri("/api/auth/internal/users/{id}", employeeId.trim())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            if (user != null && user.get("managerId") != null) {
                return String.valueOf(user.get("managerId"));
            }
            return null;
        } catch (Exception ex) {
            log.warn("Failed to retrieve manager for employee {}: {}", employeeId, ex.getMessage());
            return null;
        }
    }
}
