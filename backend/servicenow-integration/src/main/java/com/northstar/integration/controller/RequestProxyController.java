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
 * REST controller for proxying service catalog request creations and lookups to external ServiceNow.
 *
 * <p><b>Downstream / Workflow:</b> Called on {@code POST /integration/requests}. Returns created ServiceNow
 * REQ and RITM ticket metadata (including number and sys_id).
 */
@RestController
@RequestMapping("/integration/requests")
public class RequestProxyController {
    private final ServiceNowApiClient client;

    public RequestProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    @PostMapping
    public Map<String, Object> createRequest(@RequestBody Map<String, Object> payload) {
        return client.createRequest(payload);
    }

    @GetMapping("/{sysId}")
    public Map<String, Object> getRequest(@PathVariable("sysId") String sysId) {
        return client.getRecord("sc_req_item", sysId);
    }

    @PatchMapping("/{sysId}")
    public Map<String, Object> updateRequest(@PathVariable("sysId") String sysId, @RequestBody Map<String, Object> payload) {
        return client.updateRecord("sc_req_item", sysId, payload);
    }
}
