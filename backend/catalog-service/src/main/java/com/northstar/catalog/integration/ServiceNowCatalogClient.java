package com.northstar.catalog.integration;

import java.util.List;
import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
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
     *
     * <p><b>Purpose:</b> Issues an internal HTTP GET to {@code /integration/catalog?limit={limit}} via Eureka service discovery.
     *
     * <p><b>Downstream / Workflow:</b> Dispatched to {@code CatalogProxyController} in the ServiceNow integration service.
     *
     * @param limit Maximum number of records to retrieve.
     * @return JsonNode containing catalog data.
     */
    @GetMapping("/catalog")
    List<Map<String, Object>> list(@RequestParam("limit") int limit);
}
