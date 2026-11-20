package com.northstar.catalog.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "servicenow-integration", path = "/integration")
public interface ServiceNowCatalogClient {
    @GetMapping("/catalog")
    JsonNode list(@RequestParam("limit") int limit);
}
