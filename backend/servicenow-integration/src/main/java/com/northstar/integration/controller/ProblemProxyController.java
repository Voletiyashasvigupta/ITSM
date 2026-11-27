package com.northstar.integration.controller;

import com.northstar.integration.client.ServiceNowApiClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for proxying problem records to external ServiceNow.
 *
 * <p><b>Downstream / Workflow:</b> Called on {@code POST /integration/problems}. Returns created ServiceNow
 * PRB ticket metadata (including number and sys_id).
 */
@RestController
@RequestMapping("/integration/problems")
public class ProblemProxyController {
    private final ServiceNowApiClient client;

    public ProblemProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    @PostMapping
    public Map<String, Object> createProblem(@RequestBody Map<String, Object> payload) {
        return client.createProblem(payload);
    }
}
