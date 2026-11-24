package com.northstar.catalog.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.catalog.dto.CatalogResponse;
import com.northstar.catalog.dto.CategoryDto;
import com.northstar.catalog.dto.FormDefinitionDto;
import com.northstar.catalog.dto.FormDefinitionDto.FormFieldDto;
import com.northstar.catalog.integration.ServiceNowCatalogClient;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final ServiceNowCatalogClient serviceNow;

    private static final List<CategoryDto> CATEGORIES = List.of(
        new CategoryDto("it", "IT", "Laptops, monitors, access, and software accounts"),
        new CategoryDto("facilities", "Facilities", "Workplace, parking, and office needs"),
        new CategoryDto("hr", "People Support", "Benefits, onboarding, and HR help")
    );

    public CatalogController(StringRedisTemplate redis, ObjectMapper mapper, ServiceNowCatalogClient serviceNow) {
        this.redis = redis;
        this.mapper = mapper;
        this.serviceNow = serviceNow;
    }

    @GetMapping("/categories")
    public List<CategoryDto> listCategories() {
        return CATEGORIES;
    }

    @GetMapping(value = {"", "/items"})
    public CatalogResponse listItems(@RequestParam(name = "limit", defaultValue = "50") int limit,
                                     @RequestParam(name = "category", required = false) String category,
                                     @RequestParam(name = "search", required = false) String search) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        String cacheKey = "catalog:items:" + safeLimit;
        String cached = null;
        try {
            cached = redis.opsForValue().get(cacheKey);
        } catch (RuntimeException ignored) {
            // A cache outage must not prevent a healthy ServiceNow read.
        }

        try {
            JsonNode items = serviceNow.list(safeLimit);
            CatalogResponse response = new CatalogResponse(false, Instant.now(), items);
            try {
                redis.opsForValue().set(cacheKey, mapper.writeValueAsString(response), CACHE_TTL);
            } catch (JsonProcessingException | RuntimeException ignored) {
                // Serve fresh ServiceNow response even when cache write fails.
            }
            return response;
        } catch (Exception exception) {
            if (cached != null) {
                try {
                    CatalogResponse lastKnown = mapper.readValue(cached, CatalogResponse.class);
                    return new CatalogResponse(true, lastKnown.cachedAt(), lastKnown.items());
                } catch (JsonProcessingException ignored) {
                    // Corrupt cache entries are treated as unavailable.
                }
            }
            // Fallback response with core items when integration is unavailable
            return fallbackCatalog();
        }
    }

    @GetMapping("/items/{id}")
    public Map<String, Object> getItem(@PathVariable("id") String id) {
        String normalized = id.toLowerCase();
        if (normalized.contains("device") || normalized.contains("laptop") || normalized.equals("1")) {
            return Map.of("id", "request-a-device", "name", "Request a device", "category", "IT", "description", "Laptops, monitors and accessories");
        } else if (normalized.contains("access") || normalized.contains("account") || normalized.equals("2")) {
            return Map.of("id", "access-and-accounts", "name", "Access and accounts", "category", "IT", "description", "Software, shared drives and access");
        } else if (normalized.contains("workplace") || normalized.contains("parking") || normalized.equals("3")) {
            return Map.of("id", "workplace-services", "name", "Workplace services", "category", "Facilities", "description", "Facilities, parking and office needs");
        } else if (normalized.contains("people") || normalized.contains("hr") || normalized.equals("4")) {
            return Map.of("id", "people-support", "name", "People support", "category", "HR", "description", "Benefits, onboarding and HR help");
        }
        return Map.of("id", id, "name", id, "category", "IT", "description", "Service Catalog Item: " + id);
    }

    @GetMapping("/items/{id}/form-definition")
    public FormDefinitionDto getFormDefinition(@PathVariable("id") String id) {
        String normalized = id.toLowerCase();
        if (normalized.contains("access") || normalized.contains("account") || normalized.equals("2")) {
            return new FormDefinitionDto(
                "access-and-accounts",
                "Access and accounts",
                "Request a new account or a change to your access. Include the application and the work you need to perform.",
                List.of(
                    new FormFieldDto("accessType", "What access help do you need?", "select", List.of("New access", "Change existing access", "Remove access", "Unlock account or reset sign-in", "Shared mailbox or distribution list", "VPN or network access", "Hardware token / MFA"), true, null),
                    new FormFieldDto("application", "Application, system, or shared resource", "text", null, true, "For example: SAP, Salesforce, a shared drive, or a team mailbox."),
                    new FormFieldDto("accessLevel", "Access level needed", "select", List.of("Standard user", "Read only", "Contributor / editor", "Approver", "Other / not sure"), true, null),
                    new FormFieldDto("duration", "How long is access needed?", "select", List.of("Ongoing role requirement", "Temporary — up to 30 days", "Temporary — 1 to 6 months", "Not sure"), true, null),
                    new FormFieldDto("reason", "Business justification", "textarea", null, true, null)
                )
            );
        }

        // Default to device request form
        return new FormDefinitionDto(
            "request-a-device",
            "Request a device",
            "Choose the equipment and tell us how it will be used. Your answers help IT prepare the right device.",
            List.of(
                new FormFieldDto("item", "What do you need?", "select", List.of("Laptop", "Desktop computer", "Monitor", "Docking station", "Keyboard or mouse", "Headset or webcam", "Mobile phone", "Other"), true, null),
                new FormFieldDto("workStyle", "Primary work setup", "select", List.of("Office based", "Hybrid", "Remote"), true, null),
                new FormFieldDto("location", "Office or delivery location", "text", null, true, "Enter an office/site name. Do not include a home address."),
                new FormFieldDto("neededBy", "When do you need it?", "date", null, true, null),
                new FormFieldDto("reason", "Business reason", "textarea", null, true, null)
            )
        );
    }

    private CatalogResponse fallbackCatalog() {
        try {
            JsonNode sampleItems = mapper.readTree("""
                [
                  {"sys_id": "item-1", "name": "Request a device", "short_description": "Laptops, monitors and accessories", "category": "IT"},
                  {"sys_id": "item-2", "name": "Access and accounts", "short_description": "Software, shared drives and access", "category": "IT"},
                  {"sys_id": "item-3", "name": "Workplace services", "short_description": "Facilities, parking and office needs", "category": "Facilities"},
                  {"sys_id": "item-4", "name": "People support", "short_description": "Benefits, onboarding and HR help", "category": "HR"}
                ]
            """);
            return new CatalogResponse(true, Instant.now(), sampleItems);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Catalog is unavailable");
        }
    }
}
