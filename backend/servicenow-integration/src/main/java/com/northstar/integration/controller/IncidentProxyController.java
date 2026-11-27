package com.northstar.integration.controller;

import com.northstar.integration.client.ServiceNowApiClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for proxying incident creation requests to external ServiceNow.
 *
 * <p><b>Purpose:</b> Receives incident payloads from internal services (such as {@code incident-service})
 * and submits them directly to ServiceNow's Table API via {@link ServiceNowApiClient}.
 *
 * <p><b>Downstream / Workflow:</b> Called on {@code POST /integration/incidents}. Returns the created ServiceNow
 * incident metadata (including ticket number INC... and sys_id).
 */
@RestController
@RequestMapping("/integration/incidents")
public class IncidentProxyController {
    private final ServiceNowApiClient client;

    public IncidentProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    /**
     * Creates an incident in ServiceNow.
     *
     * <p><b>Purpose:</b> Forwards the JSON payload to ServiceNow's {@code incident} table.
     *
     * <p><b>Downstream / Workflow:</b> Delegates to {@link ServiceNowApiClient#createIncident(Map)}.
     *
     * @param payload Map of incident fields (short_description, description, category, impact, urgency).
     * @return Map containing created ServiceNow ticket details.
     */
    @PostMapping
    public Map<String, Object> createIncident(@RequestBody Map<String, Object> payload) {
        return client.createIncident(payload);
    }
}
