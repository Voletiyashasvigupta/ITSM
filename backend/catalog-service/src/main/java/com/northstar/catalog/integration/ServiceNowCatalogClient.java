package com.northstar.catalog.integration;

import java.util.List;
import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Declarative OpenFeign HTTP client targeting the ServiceNow Integration microservice.
 *
 * <p><b>Purpose:</b> Defines the remote contract to invoke the internal {@code /integration/catalog} endpoint
 * hosted by the {@code servicenow-integration} service without manual HTTP plumbing.
 *
 * <p><b>Downstream / Workflow:</b> Spring Cloud OpenFeign creates a dynamic proxy registered in the context.
 * Called by {@link com.northstar.catalog.controller.CatalogController} to fetch upstream catalog items.
 */
@FeignClient(name = "servicenow-integration", path = "/integration")
public interface ServiceNowCatalogClient {

    /**
     * Retrieves catalog items from the ServiceNow integration boundary.
     */
    @GetMapping("/catalog")
    List<Map<String, Object>> list(@RequestParam("limit") int limit);

    /**
     * Retrieves detailed metadata and variables for a specific catalog item.
     */
    @GetMapping("/catalog/items/{sysId}")
    Map<String, Object> getItemDetails(@PathVariable("sysId") String sysId);
}
