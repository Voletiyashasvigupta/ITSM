package com.northstar.request.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.request.dto.RequestSubmission;
import com.northstar.request.dto.RequestSubmissionResponse;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.outbox.OutboxMessageEntity;
import com.northstar.request.repository.OutboxMessageRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import com.northstar.request.repository.ApprovalRepository;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.entity.ApprovalEntity;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.integration.ServiceNowRequestClient;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transactional writer component persisting service requests, initial approvals, audit history, and outbox messages.
 *
 * <p><b>Purpose:</b> Implements the core transactional boundary for request submission. In a single MySQL transaction:
 * <ol>
 *   <li>Saves {@link ServiceRequestEntity} with idempotency key and initial status.</li>
 *   <li>Saves {@link ApprovalEntity} if an approver is specified.</li>
 *   <li>Saves initial {@link RequestHistoryEntity} audit entry.</li>
 *   <li>Saves {@link OutboxMessageEntity} containing the domain event for asynchronous RabbitMQ relay.</li>
 * </ol>
 *
 * <p><b>Downstream / Workflow:</b> Called by {@link RequestSubmissionService#submit}.
 */
@Service
public class RequestSubmissionWriter {
    private final ServiceRequestRepository requests;
    private final OutboxMessageRepository outbox;
    private final ObjectMapper mapper;
    private final ApprovalRepository approvals;
    private final RequestHistoryRepository history;
    private final ServiceNowRequestClient serviceNowClient;

    /**
     * Constructs RequestSubmissionWriter.
     *
     * @param requests Service request repository.
     * @param outbox Outbox message repository.
     * @param mapper Jackson ObjectMapper.
     * @param approvals Approval repository.
     * @param history Audit history repository.
     * @param serviceNowClient ServiceNow request client.
     */
    public RequestSubmissionWriter(ServiceRequestRepository requests, OutboxMessageRepository outbox, ObjectMapper mapper,
                                   ApprovalRepository approvals, RequestHistoryRepository history,
                                   ServiceNowRequestClient serviceNowClient) {
        this.requests = requests; this.outbox = outbox; this.mapper = mapper; this.approvals = approvals; this.history = history;
        this.serviceNowClient = serviceNowClient;
    }

    /**
     * Atomically creates the request entity, approval record, audit history row, and outbox event.
     *
     * @param idempotencyKey Client idempotency key.
     * @param requesterId Requester employee ID.
     * @param input Request form inputs.
     * @return RequestSubmissionResponse DTO.
     */
    @Transactional
    public RequestSubmissionResponse create(String idempotencyKey, String requesterId, RequestSubmission input) {
        String fieldsJson;
        try { fieldsJson = mapper.writeValueAsString(input.fields() == null ? java.util.Map.of() : input.fields()); }
        catch (JsonProcessingException exception) { throw new IllegalArgumentException("Request fields are invalid", exception); }
        ServiceRequestEntity entity = new ServiceRequestEntity(
                idempotencyKey, input.serviceName().trim(), input.description().trim(), requesterId, input.requestedForId().trim(), input.approverId().trim(), fieldsJson);
        Map<String, String> storedFields = new HashMap<>(input.fields() == null ? Map.of() : input.fields());
        if (storedFields.get("orgGroup") != null) {
            entity.setOrgGroup(storedFields.get("orgGroup"));
        }

        // Attempt live synchronization with external ServiceNow Cloud instance
        // Submits full catalog request workflow: parent sc_request (REQ) and sc_req_item (RITM)
        boolean outage = false;
        String outageMessage = null;
        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", input.serviceName().trim());
            snPayload.put("correlation_id", idempotencyKey);
            snPayload.put("variables", new HashMap<>(storedFields));

            StringBuilder descBuilder = new StringBuilder();
            descBuilder.append("Catalog Item: ").append(input.serviceName().trim()).append("\n");
            descBuilder.append("Requester: ").append(requesterId).append("\n");
            descBuilder.append("Requested For: ").append(input.requestedForId().trim()).append("\n");
            descBuilder.append("Approver: ").append(input.approverId().trim()).append("\n\n");
            descBuilder.append("Submitted Answers:\n");
            storedFields.forEach((k, v) -> {
                if (!"requestNumber".equals(k) && !"number".equals(k)) {
                    descBuilder.append(" - ").append(k).append(": ").append(v).append("\n");
                }
            });
            snPayload.put("description", descBuilder.toString().trim());

            StringBuilder special = new StringBuilder();
            special.append("Requested for: ").append(input.requestedForId().trim()).append(", Approver: ").append(input.approverId().trim()).append(". Answers: ");
            storedFields.forEach((k, v) -> {
                if (!"requestNumber".equals(k) && !"number".equals(k)) {
                    special.append(k).append("=").append(v).append("; ");
                }
            });
            snPayload.put("special_instructions", special.toString().trim());
            snPayload.put("requested_for", input.requestedForId().trim());

            String catItemId = storedFields.get("cat_item");
            if (catItemId == null || catItemId.isBlank()) catItemId = storedFields.get("catalogItemId");
            if (catItemId == null || catItemId.isBlank()) catItemId = storedFields.get("sys_id");
            if (catItemId != null && !catItemId.isBlank() && catItemId.length() == 32) {
                snPayload.put("cat_item", catItemId.trim());
            }

            int qty = 1;
            if (storedFields.containsKey("quantity")) {
                try { qty = Integer.parseInt(storedFields.get("quantity").replace("+", "").trim()); } catch (Exception ignored) {}
            }
            snPayload.put("quantity", qty);

            Map<String, Object> snResponse = serviceNowClient.createRequest(snPayload);
            if (snResponse != null) {
                String reqNum = snResponse.get("request_number") != null ? String.valueOf(snResponse.get("request_number")) : null;
                String ritmNum = snResponse.get("ritm_number") != null ? String.valueOf(snResponse.get("ritm_number")) : null;
                String primaryNum = reqNum != null ? reqNum : (snResponse.get("number") != null ? String.valueOf(snResponse.get("number")) : ritmNum);
                String primarySysId = snResponse.get("sys_id") != null ? String.valueOf(snResponse.get("sys_id")) : String.valueOf(snResponse.get("ritm_sys_id"));

                if (primaryNum != null && !primaryNum.isBlank()) {
                    entity.setServiceNowNumber(primaryNum);
                    storedFields.put("serviceNowNumber", primaryNum);
                }
                if (reqNum != null) storedFields.put("serviceNowReqNumber", reqNum);
                if (ritmNum != null) storedFields.put("serviceNowRitmNumber", ritmNum);
                if (snResponse.get("request_sys_id") != null) storedFields.put("serviceNowReqSysId", String.valueOf(snResponse.get("request_sys_id")));
                if (snResponse.get("ritm_sys_id") != null) storedFields.put("serviceNowRitmSysId", String.valueOf(snResponse.get("ritm_sys_id")));

                if (primarySysId != null && !primarySysId.isBlank() && !"null".equals(primarySysId)) {
                    entity.setExternalLink(primarySysId, "servicenow");
                }
                storedFields.put("syncStatus", "SYNCED");
                storedFields.remove("syncError");
                try {
                    entity.setFieldsJson(mapper.writeValueAsString(storedFields));
                } catch (Exception ignored) {}
            }
        } catch (Exception ex) {
            // Outage handling: save local record as pending, queue for retry, and record in audit history
            outage = true;
            outageMessage = ex.getMessage() != null ? ex.getMessage() : ex.toString();
            storedFields.put("syncStatus", "PENDING_RETRY");
            storedFields.put("syncError", "ServiceNow unreachable: " + outageMessage);
            storedFields.put("syncAttempts", "1");
            storedFields.put("nextSyncAttemptAt", Instant.now().plusSeconds(10).toString());
            try {
                entity.setFieldsJson(mapper.writeValueAsString(storedFields));
            } catch (Exception ignored) {}
        }

        entity = requests.saveAndFlush(entity);
        if (entity.getApproverId() != null && !entity.getApproverId().isBlank()) {
            approvals.save(new ApprovalEntity(entity.getId(), entity.getApproverId()));
        }
        history.save(new RequestHistoryEntity(entity.getId(), requesterId, "SUBMITTED", null, entity.getStatus().name(), null));
        if (outage) {
            history.save(new RequestHistoryEntity(entity.getId(), "system", "SERVICENOW_OUTAGE", null, entity.getStatus().name(),
                    "ServiceNow unreachable during submission (" + outageMessage + "). Record preserved locally and queued for background retry."));
        }
        try {
            var event = new RequestQueuedEvent(entity.getId(), entity.getRequestNumber(), entity.getIdempotencyKey(), entity.getServiceName(),
                    entity.getDescription(), entity.getRequesterId(), entity.getRequestedForId(), entity.getApproverId(),
                    input.fields() == null ? java.util.Map.of() : input.fields(), entity.getCreatedAt());
            outbox.save(new OutboxMessageEntity(entity.getId(), "RequestSubmissionQueued", mapper.writeValueAsString(event)));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not create request outbox payload", exception);
        }
        return response(entity);
    }

    private RequestSubmissionResponse response(ServiceRequestEntity entity) {
        return new RequestSubmissionResponse(entity.getId(), entity.getRequestNumber(), entity.getServiceName(), entity.getRequesterId(),
                entity.getRequestedForId(), entity.getStatus(), entity.getServiceNowNumber(), entity.getCreatedAt());
    }

    public record RequestQueuedEvent(UUID requestId, String requestNumber, String idempotencyKey, String serviceName, String description,
                                     String requesterId, String requestedForId, String approverId, java.util.Map<String,String> fields, Instant createdAt) {}
}
