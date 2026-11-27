package com.northstar.integration.controller;

import com.northstar.integration.client.ServiceNowApiClient;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller that proxies internal catalog queries to the ServiceNow client.
 *
 * <p><b>Purpose:</b> Exposes an internal HTTP endpoint ({@code /integration/catalog}) allowing the
 * Northstar Catalog Service to retrieve catalog items from ServiceNow without directly holding
 * external credentials or managing OAuth lifecycle.
 *
 * <p><b>Downstream / Workflow:</b> Called by {@code com.northstar.catalog.integration.ServiceNowCatalogClient}.
 * Sanitizes the query limit and delegates directly to {@link ServiceNowApiClient#readCatalog(int)}.
 */
@RestController
@RequestMapping("/integration/catalog")
public class CatalogProxyController {
    private final ServiceNowApiClient client;

    /**
     * Constructs the CatalogProxyController with the injected ServiceNow client.
     *
     * <p><b>Purpose:</b> Initializes the proxy controller with its HTTP delegate.
     *
     * <p><b>Downstream / Workflow:</b> Spring autowires this dependency at startup.
     *
     * @param client The ServiceNow API client.
     */
    public CatalogProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    /**
     * Handles GET requests to retrieve catalog items with limit clamping.
     *
     * <p><b>Purpose:</b> Bounds the request limit between 1 and 100 to prevent oversized payloads,
     * and fetches catalog JSON.
     *
     * <p><b>Downstream / Workflow:</b> Invokes {@link ServiceNowApiClient#readCatalog(int)} and writes
     * the JSON array directly into the HTTP response.
     *
     * @param limit Desired number of items (default 50, maximum 100).
     * @return JsonNode containing catalog items.
     */
    @GetMapping
    public List<Map<String, Object>> readCatalog(@RequestParam(name = "limit", defaultValue = "50") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return client.readCatalog(safeLimit);
    }
}

