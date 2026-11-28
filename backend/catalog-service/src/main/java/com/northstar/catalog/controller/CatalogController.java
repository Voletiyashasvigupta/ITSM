package com.northstar.catalog.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.catalog.dto.CatalogResponse;
import com.northstar.catalog.dto.CategoryDto;
import com.northstar.catalog.dto.FormDefinitionDto;
import com.northstar.catalog.dto.FormDefinitionDto.FormFieldDto;
import com.northstar.catalog.integration.ServiceNowCatalogClient;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for browsing catalog items, category classifications, and request form schemas.
 *
 * <p><b>Purpose:</b> Exposes service catalog endpoints to the Northstar frontend. Orchestrates live queries
 * to ServiceNow via {@link ServiceNowCatalogClient}, Redis caching with 5-minute TTL, graceful degradation
 * to stale cache on upstream errors, and fallback sample catalogs when ServiceNow is unconfigured or unreachable.
 * Supports Asset Purchases and dynamic forms matching selected ServiceNow catalog items.
 */
@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private static final Logger log = LoggerFactory.getLogger(CatalogController.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final ServiceNowCatalogClient serviceNow;

    private static final List<CategoryDto> CATEGORIES = List.of(
        new CategoryDto("it", "IT", "Laptops, monitors, access, and software accounts"),
        new CategoryDto("procurement", "Asset Procurement", "Hardware assets, laptops, monitors, equipment purchasing"),
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
        } catch (RuntimeException ignored) {}

        try {
            List<Map<String, Object>> items = new ArrayList<>(serviceNow.list(safeLimit));
            ensureAssetPurchaseItem(items);
            CatalogResponse response = new CatalogResponse(false, Instant.now(), items);
            try {
                redis.opsForValue().set(cacheKey, mapper.writeValueAsString(response), CACHE_TTL);
            } catch (JsonProcessingException | RuntimeException ignored) {}
            return response;
        } catch (Exception exception) {
            if (cached != null) {
                try {
                    CatalogResponse lastKnown = mapper.readValue(cached, CatalogResponse.class);
                    return new CatalogResponse(true, lastKnown.cachedAt(), lastKnown.items());
                } catch (JsonProcessingException ignored) {}
            }
            return fallbackCatalog();
        }
    }

    private static void ensureAssetPurchaseItem(List<Map<String, Object>> items) {
        boolean hasAssetPurchase = items.stream().anyMatch(it -> {
            String name = String.valueOf(it.getOrDefault("name", "")).toLowerCase();
            return name.contains("asset purchase") || name.equals("purchase an asset");
        });
        if (!hasAssetPurchase) {
            Map<String, Object> assetItem = new HashMap<>();
            assetItem.put("sys_id", "asset-purchase");
            assetItem.put("name", "Asset purchase");
            assetItem.put("short_description", "Procure hardware assets, laptops, monitors, or equipment through ServiceNow");
            assetItem.put("category", "Asset Procurement");
            assetItem.put("active", "true");
            items.add(0, assetItem);
        }
    }

    @GetMapping("/items/{id}")
    public Map<String, Object> getItem(@PathVariable("id") String id) {
        String normalized = id.toLowerCase();
        if (normalized.contains("asset") || normalized.contains("purchase")) {
            return Map.of("id", "asset-purchase", "name", "Asset purchase", "category", "IT", "description", "Procure hardware assets, laptops, monitors, or equipment through ServiceNow");
        } else if (normalized.contains("device") || normalized.contains("laptop") || normalized.equals("1")) {
            return Map.of("id", "request-a-device", "name", "Request a device", "category", "IT", "description", "Laptops, monitors and accessories");
        } else if (normalized.contains("access") || normalized.contains("account") || normalized.equals("2")) {
            return Map.of("id", "access-and-accounts", "name", "Access and accounts", "category", "IT", "description", "Software, shared drives and access");
        } else if (normalized.contains("workplace") || normalized.contains("parking") || normalized.equals("3")) {
            return Map.of("id", "workplace-services", "name", "Workplace services", "category", "Facilities", "description", "Facilities, parking and office needs");
        } else if (normalized.contains("people") || normalized.contains("hr") || normalized.equals("4")) {
            return Map.of("id", "people-support", "name", "People support", "category", "HR", "description", "Benefits, onboarding and HR help");
        }

        // Try looking up live from ServiceNow
        try {
            Map<String, Object> details = serviceNow.getItemDetails(id);
            if (details != null && details.containsKey("name")) {
                String name = String.valueOf(details.get("name"));
                String desc = String.valueOf(details.getOrDefault("short_description", name));
                return Map.of("id", id, "name", name, "category", "IT", "description", desc);
            }
        } catch (Exception ignored) {}

        return Map.of("id", id, "name", id, "category", "IT", "description", "Service Catalog Item: " + id);
    }

    @GetMapping("/items/{id}/form-definition")
    public FormDefinitionDto getFormDefinition(@PathVariable("id") String id) {
        String normalized = id.toLowerCase();

        // 1. Asset Purchase Workflow
        if (normalized.contains("asset") || normalized.contains("purchase")) {
            return new FormDefinitionDto(
                "asset-purchase",
                "Asset purchase",
                "Procure hardware assets, computer equipment, peripherals, and workstations through ServiceNow with budget and manager approval.",
                List.of(
                    new FormFieldDto("assetType", "Asset type", "select", List.of("Laptop / Workstation", "Monitor / Display", "Server & Storage", "Networking Equipment", "Mobile & Tablet", "Peripherals & Accessories", "Specialized Hardware"), true, "Select the category of asset required."),
                    new FormFieldDto("assetModel", "Asset model and specifications", "text", null, true, "Specify model and specs (e.g. Apple MacBook Pro 16\" M3 Max / 64GB RAM or Dell Precision 5680)."),
                    new FormFieldDto("quantity", "Quantity needed", "number", null, true, "Number of units required (e.g. 1)."),
                    new FormFieldDto("estimatedBudget", "Estimated budget ($ USD)", "number", null, true, "Estimated total cost in USD (e.g. 2500)."),
                    new FormFieldDto("costCenter", "Department or cost center", "text", null, true, "Enter billing cost center or team name (e.g. Engineering - CC-402)."),
                    new FormFieldDto("deliveryLocation", "Delivery location", "text", null, true, "Enter destination office facility or delivery address."),
                    new FormFieldDto("deliveryContact", "Delivery contact person", "text", null, true, "Name and phone or email of the recipient."),
                    new FormFieldDto("neededBy", "Target delivery date", "date", null, true, "Required delivery or setup date."),
                    new FormFieldDto("reason", "Business justification", "textarea", null, true, "Explain why this asset is required and how it supports company operations."),
                    new FormFieldDto("isExpedited", "Expedited priority shipping", "checkbox", null, false, "Check if expedited procurement/delivery is requested."),
                    new FormFieldDto("expeditedJustification", "Expedited shipping justification", "textarea", null, false, "Explain why standard procurement lead time cannot be accommodated.",
                            new FormDefinitionDto.ConditionalRule("isExpedited", "true", "show")),
                    new FormFieldDto("accessories", "Included accessories", "multi-select", List.of("Docking Station", "Dual Monitors", "Wireless Keyboard & Mouse", "Laptop Stand", "Carrying Sleeve", "Extra Power Supply"), false, "Select any optional peripherals needed."),
                    new FormFieldDto("referenceAsset", "Replaced asset reference / tag", "reference", null, false, "If replacing an existing equipment, provide previous asset tag or serial number.")
                )
            );
        }

        // 2. Access and Accounts Workflow
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

        // 3. Workplace Services Workflow
        if (normalized.contains("workplace") || normalized.contains("parking") || normalized.equals("3")) {
            return new FormDefinitionDto(
                "workplace-services",
                "Workplace services",
                "Submit a facilities service request. Facilities handles office seating, parking permits, and workplace maintenance.",
                List.of(
                    new FormFieldDto("requestType", "What workplace help do you need?", "select", List.of("Maintenance or repair", "Parking permit", "Office move or seating", "Access badge", "Furniture or ergonomics", "Office supplies", "Cleaning or facilities", "Safety concern"), true, null),
                    new FormFieldDto("location", "Building or location", "text", null, true, "Enter the office building, floor, or room number."),
                    new FormFieldDto("neededBy", "Preferred date", "date", null, true, null),
                    new FormFieldDto("reason", "Description of request", "textarea", null, true, null)
                )
            );
        }

        // 4. People Support Workflow
        if (normalized.contains("people") || normalized.contains("hr") || normalized.equals("4")) {
            return new FormDefinitionDto(
                "people-support",
                "People support",
                "Get help with benefits, payroll, leave, and general HR support from People Operations.",
                List.of(
                    new FormFieldDto("topic", "What do you need help with?", "select", List.of("Benefits enrollment", "Leave of absence", "Payroll or compensation inquiry", "Employment verification", "Onboarding / transfer support", "Other HR question"), true, null),
                    new FormFieldDto("reason", "Details and questions", "textarea", null, true, "Provide details about your question or request.")
                )
            );
        }

        // 5. Check if this is a live ServiceNow catalog item with custom variables
        try {
            Map<String, Object> details = serviceNow.getItemDetails(id);
            if (details != null) {
                String itemName = String.valueOf(details.getOrDefault("name", id));
                String itemDesc = String.valueOf(details.getOrDefault("short_description", itemName));
                List<FormFieldDto> dynamicFields = extractVariablesFromServiceNow(details);
                if (!dynamicFields.isEmpty()) {
                    return new FormDefinitionDto(id, itemName, itemDesc, dynamicFields);
                }
                // If it's a specific hardware or software item from ServiceNow without custom variables:
                if (normalized.contains("monitor") || itemName.toLowerCase().contains("monitor")) {
                    return new FormDefinitionDto(
                        id, itemName, itemDesc,
                        List.of(
                            new FormFieldDto("item", "Monitor specification", "select", List.of("Standard 22\" Monitor", "Standard 24\" Monitor", "UltraWide 34\" Monitor", "Dual Monitor Setup"), true, null),
                            new FormFieldDto("workStyle", "Primary work setup", "select", List.of("Office based", "Hybrid", "Remote"), true, null),
                            new FormFieldDto("location", "Office or delivery location", "text", null, true, "Enter office site or desk location."),
                            new FormFieldDto("neededBy", "When do you need it?", "date", null, true, null),
                            new FormFieldDto("reason", "Business justification", "textarea", null, true, null)
                        )
                    );
                }
                return new FormDefinitionDto(
                    id, itemName, itemDesc,
                    List.of(
                        new FormFieldDto("item", "Model / Item", "text", null, true, "Specify model or requirements for " + itemName),
                        new FormFieldDto("workStyle", "Primary work setup", "select", List.of("Office based", "Hybrid", "Remote"), true, null),
                        new FormFieldDto("location", "Office or delivery location", "text", null, true, "Enter office site or desk location."),
                        new FormFieldDto("neededBy", "When do you need it?", "date", null, true, null),
                        new FormFieldDto("reason", "Business reason", "textarea", null, true, null)
                    )
                );
            }
        } catch (Exception ex) {
            log.debug("Live ServiceNow item lookup for {} failed: {}", id, ex.getMessage());
        }

        // 6. Default to device request form
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

    @SuppressWarnings("unchecked")
    private List<FormFieldDto> extractVariablesFromServiceNow(Map<String, Object> details) {
        List<FormFieldDto> fields = new ArrayList<>();
        Object varsObj = details.get("variables");
        if (!(varsObj instanceof List<?> varList)) return fields;

        for (Object item : varList) {
            if (!(item instanceof Map<?, ?> varMap)) continue;
            String name = (String) varMap.get("name");
            String label = (String) varMap.get("label");
            if (label == null || label.isBlank()) label = (String) varMap.get("question_text");
            if (label == null || label.isBlank()) label = name;
            if (name == null || name.isBlank()) continue;

            String friendlyType = (String) varMap.get("friendly_type");
            boolean mandatory = Boolean.TRUE.equals(varMap.get("mandatory")) || "true".equalsIgnoreCase(String.valueOf(varMap.get("mandatory")));
            String helpText = (String) varMap.get("help_text");

            if ("container_start".equalsIgnoreCase(friendlyType) || "container_end".equalsIgnoreCase(friendlyType)) {
                continue;
            }

            String kind = "text";
            List<String> options = null;

            if ("multi_line_text".equalsIgnoreCase(friendlyType) || "textarea".equalsIgnoreCase(friendlyType)) {
                kind = "textarea";
            } else if ("check_box".equalsIgnoreCase(friendlyType) || "checkbox".equalsIgnoreCase(friendlyType) || "boolean".equalsIgnoreCase(friendlyType)) {
                kind = "checkbox";
            } else if ("select_box".equalsIgnoreCase(friendlyType) || "multiple_choice".equalsIgnoreCase(friendlyType) || "choice".equalsIgnoreCase(friendlyType)) {
                kind = "select";
                options = List.of("Standard", "Custom", "Other");
            } else if ("multi_select".equalsIgnoreCase(friendlyType) || "list".equalsIgnoreCase(friendlyType) || "glide_list".equalsIgnoreCase(friendlyType)) {
                kind = "multi-select";
                options = List.of("Option A", "Option B", "Option C");
            } else if ("date".equalsIgnoreCase(friendlyType) || "date_time".equalsIgnoreCase(friendlyType)) {
                kind = "date";
            } else if ("integer".equalsIgnoreCase(friendlyType) || "numeric".equalsIgnoreCase(friendlyType) || "decimal".equalsIgnoreCase(friendlyType)) {
                kind = "number";
            } else if ("reference".equalsIgnoreCase(friendlyType)) {
                kind = "reference";
            }

            fields.add(new FormFieldDto(name, label, kind, options, mandatory, helpText));
        }

        // Ensure neededBy and reason exist
        if (fields.stream().noneMatch(f -> "neededBy".equalsIgnoreCase(f.name()))) {
            fields.add(new FormFieldDto("neededBy", "When do you need it?", "date", null, true, null));
        }
        if (fields.stream().noneMatch(f -> "reason".equalsIgnoreCase(f.name()))) {
            fields.add(new FormFieldDto("reason", "Business reason", "textarea", null, true, null));
        }
        return fields;
    }

    private CatalogResponse fallbackCatalog() {
        List<Map<String, Object>> sampleItems = new ArrayList<>(List.of(
            Map.of("sys_id", "asset-purchase", "name", "Asset purchase", "short_description", "Procure hardware assets, laptops, monitors, or equipment through ServiceNow", "category", "Asset Procurement"),
            Map.of("sys_id", "item-1", "name", "Request a device", "short_description", "Laptops, monitors and accessories", "category", "IT"),
            Map.of("sys_id", "item-2", "name", "Access and accounts", "short_description", "Software, shared drives and access", "category", "IT"),
            Map.of("sys_id", "item-3", "name", "Workplace services", "short_description", "Facilities, parking and office needs", "category", "Facilities"),
            Map.of("sys_id", "item-4", "name", "People support", "short_description", "Benefits, onboarding and HR help", "category", "HR")
        ));
        return new CatalogResponse(true, Instant.now(), sampleItems);
    }
}
