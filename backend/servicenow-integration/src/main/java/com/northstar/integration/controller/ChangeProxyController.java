package com.northstar.integration.controller;

import com.northstar.integration.client.ServiceNowApiClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for proxying change requests to external ServiceNow.
 *
 * <p><b>Downstream / Workflow:</b> Called on {@code POST /integration/changes}. Returns created ServiceNow
 * CHG ticket metadata (including number and sys_id).
 */
@RestController
@RequestMapping("/integration/changes")
public class ChangeProxyController {
    private final ServiceNowApiClient client;

    public ChangeProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    @PostMapping
    public Map<String, Object> createChange(@RequestBody Map<String, Object> payload) {
        return client.createChange(payload);
    }
}
