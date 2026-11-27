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
        String customNum = input.fields() != null ? input.fields().get("requestNumber") : null;
        if (customNum == null && input.fields() != null) customNum = input.fields().get("number");
        if (customNum != null && !customNum.isBlank()) {
            entity.setServiceNowNumber(customNum.trim());
        }

        // Attempt live synchronization with external ServiceNow Cloud instance
        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", input.serviceName().trim());
            snPayload.put("description", input.description().trim());
            snPayload.put("special_instructions", "Requested for: " + input.requestedForId().trim() + ", Approver: " + input.approverId().trim());

            Map<String, Object> snResponse = serviceNowClient.createRequest(snPayload);
            if (snResponse != null && snResponse.get("number") != null) {
                entity.setServiceNowNumber(String.valueOf(snResponse.get("number")));
                entity.setExternalLink(String.valueOf(snResponse.get("sys_id")), "servicenow");
            }
        } catch (Exception ignored) {
            // Graceful fallback to local numbering
        }

        entity = requests.saveAndFlush(entity);
        if (entity.getApproverId() != null && !entity.getApproverId().isBlank()) {
            approvals.save(new ApprovalEntity(entity.getId(), entity.getApproverId()));
        }
        history.save(new RequestHistoryEntity(entity.getId(), requesterId, "SUBMITTED", null, entity.getStatus().name(), null));
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
