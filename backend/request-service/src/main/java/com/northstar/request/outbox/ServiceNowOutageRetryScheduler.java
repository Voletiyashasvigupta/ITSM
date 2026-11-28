package com.northstar.request.outbox;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.integration.ServiceNowRequestClient;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled background task for handling ServiceNow outages and transient connection failures.
 *
 * <p><b>Resilience & Idempotency:</b>
 * <ul>
 *   <li>Periodically inspects local requests saved with {@code "syncStatus":"PENDING_RETRY"}.</li>
 *   <li>Applies exponential backoff between retry attempts ((1 &lt;&lt; attempts) * 5 seconds).</li>
 *   <li>Enforces max retry limit (5). Upon exceeding, marks {@code "syncStatus":"FAILED"} with human-visible reason.</li>
 *   <li>Maintains correlation ID for zero-duplication guarantee across retries.</li>
 *   <li>Records all retry attempts, successes, and failure reasons in local audit history.</li>
 * </ul>
 */
@Component
public class ServiceNowOutageRetryScheduler {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowOutageRetryScheduler.class);
    private static final int MAX_RETRIES = 5;

    private final ServiceRequestRepository requests;
    private final RequestHistoryRepository history;
    private final ServiceNowRequestClient serviceNowClient;
    private final ObjectMapper mapper;

    public ServiceNowOutageRetryScheduler(ServiceRequestRepository requests,
                                          RequestHistoryRepository history,
                                          ServiceNowRequestClient serviceNowClient,
                                          ObjectMapper mapper) {
        this.requests = requests;
        this.history = history;
        this.serviceNowClient = serviceNowClient;
        this.mapper = mapper;
    }

    @Scheduled(fixedDelay = 10000, initialDelay = 10000)
    public void processPendingRetries() {
        List<ServiceRequestEntity> pending = requests.findByFieldsJsonContaining("\"syncStatus\":\"PENDING_RETRY\"");
        if (pending.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        for (ServiceRequestEntity req : pending) {
            try {
                processSingleRequest(req, now);
            } catch (Exception e) {
                log.warn("Error processing background ServiceNow retry for request {}: {}", req.getRequestNumber(), e.getMessage());
            }
        }
    }

    @Transactional
    public void processSingleRequest(ServiceRequestEntity req, Instant now) {
        Map<String, String> fields = new HashMap<>();
        if (req.getFieldsJson() != null && !req.getFieldsJson().isBlank()) {
            try {
                fields = new HashMap<>(mapper.readValue(req.getFieldsJson(), new TypeReference<Map<String, String>>() {}));
            } catch (Exception ignored) {}
        }

        int attempts = 1;
        if (fields.get("syncAttempts") != null) {
            try { attempts = Integer.parseInt(fields.get("syncAttempts")); } catch (Exception ignored) {}
        }

        if (attempts >= MAX_RETRIES) {
            fields.put("syncStatus", "FAILED");
            fields.put("syncError", "Exceeded max retry limit (" + MAX_RETRIES + " attempts) during ServiceNow outage. Manual retry required.");
            try { req.setFieldsJson(mapper.writeValueAsString(fields)); } catch (Exception ignored) {}
            requests.save(req);
            history.save(new RequestHistoryEntity(req.getId(), "system", "SERVICENOW_SYNC_MAX_RETRIES", null, req.getStatus().name(),
                    "ServiceNow sync reached max retry limit (" + MAX_RETRIES + "). Marked as FAILED for manual intervention."));
            return;
        }

        String nextAttemptStr = fields.get("nextSyncAttemptAt");
        if (nextAttemptStr != null && !nextAttemptStr.isBlank()) {
            try {
                Instant nextAttempt = Instant.parse(nextAttemptStr);
                if (now.isBefore(nextAttempt)) {
                    return; // Wait until backoff expires
                }
            } catch (Exception ignored) {}
        }

        // Attempt submission to ServiceNow
        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", req.getServiceName());
            snPayload.put("correlation_id", req.getIdempotencyKey());
            snPayload.put("variables", new HashMap<>(fields));
            snPayload.put("requested_for", req.getRequestedForId());

            String catItemId = fields.get("cat_item");
            if (catItemId == null || catItemId.isBlank()) catItemId = fields.get("sys_id");
            if (catItemId != null && !catItemId.isBlank() && catItemId.length() == 32) {
                snPayload.put("cat_item", catItemId.trim());
            }

            int qty = 1;
            if (fields.containsKey("quantity")) {
                try { qty = Integer.parseInt(fields.get("quantity").replace("+", "").trim()); } catch (Exception ignored) {}
            }
            snPayload.put("quantity", qty);

            Map<String, Object> snResponse = serviceNowClient.createRequest(snPayload);
            if (snResponse != null) {
                String reqNum = snResponse.get("request_number") != null ? String.valueOf(snResponse.get("request_number")) : null;
                String ritmNum = snResponse.get("ritm_number") != null ? String.valueOf(snResponse.get("ritm_number")) : null;
                String primaryNum = reqNum != null ? reqNum : (snResponse.get("number") != null ? String.valueOf(snResponse.get("number")) : ritmNum);
                String primarySysId = snResponse.get("sys_id") != null ? String.valueOf(snResponse.get("sys_id")) : String.valueOf(snResponse.get("ritm_sys_id"));

                if (primaryNum != null && !primaryNum.isBlank()) {
                    req.setServiceNowNumber(primaryNum);
                    fields.put("serviceNowNumber", primaryNum);
                }
                if (reqNum != null) fields.put("serviceNowReqNumber", reqNum);
                if (ritmNum != null) fields.put("serviceNowRitmNumber", ritmNum);
                if (snResponse.get("request_sys_id") != null) fields.put("serviceNowReqSysId", String.valueOf(snResponse.get("request_sys_id")));
                if (snResponse.get("ritm_sys_id") != null) fields.put("serviceNowRitmSysId", String.valueOf(snResponse.get("ritm_sys_id")));

                if (primarySysId != null && !primarySysId.isBlank() && !"null".equals(primarySysId)) {
                    req.setExternalLink(primarySysId, "servicenow");
                }
                fields.put("syncStatus", "SYNCED");
                fields.remove("syncError");
                fields.remove("nextSyncAttemptAt");
                req.setFieldsJson(mapper.writeValueAsString(fields));
                requests.save(req);

                history.save(new RequestHistoryEntity(req.getId(), "system", "SERVICENOW_OUTAGE_RETRY_SUCCESS", null, req.getStatus().name(),
                        "Successfully synced with ServiceNow after outage. Record: " + primaryNum));
                log.info("Successfully recovered request {} after ServiceNow outage. Primary: {}", req.getRequestNumber(), primaryNum);
            }
        } catch (Exception ex) {
            attempts++;
            long backoffSec = (1L << attempts) * 5L; // Exponential backoff: 2->20s, 3->40s, 4->80s
            fields.put("syncAttempts", String.valueOf(attempts));
            if (attempts >= MAX_RETRIES) {
                fields.put("syncStatus", "FAILED");
                fields.put("syncError", "Exceeded max retry limit (" + MAX_RETRIES + "). Last error: " + ex.getMessage());
                history.save(new RequestHistoryEntity(req.getId(), "system", "SERVICENOW_SYNC_MAX_RETRIES", null, req.getStatus().name(),
                        "ServiceNow retry attempt " + attempts + " failed. Reached limit: " + ex.getMessage()));
            } else {
                fields.put("syncStatus", "PENDING_RETRY");
                fields.put("syncError", "Outage retry " + attempts + " failed: " + ex.getMessage());
                fields.put("nextSyncAttemptAt", Instant.now().plusSeconds(backoffSec).toString());
                history.save(new RequestHistoryEntity(req.getId(), "system", "SERVICENOW_OUTAGE_RETRY_ATTEMPT", null, req.getStatus().name(),
                        "Retry attempt " + attempts + " failed: " + ex.getMessage() + ". Next retry in " + backoffSec + "s."));
            }
            try { req.setFieldsJson(mapper.writeValueAsString(fields)); } catch (Exception ignored) {}
            requests.save(req);
        }
    }
}
