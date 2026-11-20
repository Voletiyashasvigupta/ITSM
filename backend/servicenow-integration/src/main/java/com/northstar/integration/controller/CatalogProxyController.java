package com.northstar.integration.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.northstar.integration.client.ServiceNowApiClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/integration/catalog")
public class CatalogProxyController {
    private final ServiceNowApiClient client;

    public CatalogProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    @GetMapping
    public JsonNode readCatalog(@RequestParam(name = "limit", defaultValue = "50") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return client.readCatalog(safeLimit);
    }
}

