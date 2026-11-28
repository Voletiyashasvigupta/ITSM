package com.northstar.integration.controller;

import com.northstar.integration.client.ServiceNowApiClient;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for proxying incident creation, status sync, and updates to external ServiceNow.
 *
 * <p><b>Purpose:</b> Receives incident payloads from internal services (such as {@code incident-service})
 * and submits or updates them directly in ServiceNow's Table API via {@link ServiceNowApiClient}.
 *
 * <p><b>Downstream / Workflow:</b> Called on {@code POST /integration/incidents}, {@code GET /integration/incidents/{sysId}},
 * and {@code PATCH /integration/incidents/{sysId}}.
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
     */
    @PostMapping
    public Map<String, Object> createIncident(@RequestBody Map<String, Object> payload) {
        return client.createIncident(payload);
    }

    /**
     * Retrieves an incident from ServiceNow by sys_id.
     */
    @GetMapping("/{sysId}")
    public Map<String, Object> getIncident(@PathVariable("sysId") String sysId) {
        return client.getRecord("incident", sysId);
    }

    /**
     * Updates an incident in ServiceNow by sys_id.
     */
    @PatchMapping("/{sysId}")
    public Map<String, Object> updateIncident(@PathVariable("sysId") String sysId, @RequestBody Map<String, Object> payload) {
        return client.updateRecord("incident", sysId, payload);
    }
}
