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
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestSubmissionWriter {
    private final ServiceRequestRepository requests;
    private final OutboxMessageRepository outbox;
    private final ObjectMapper mapper;
    private final ApprovalRepository approvals;
    private final RequestHistoryRepository history;

    public RequestSubmissionWriter(ServiceRequestRepository requests, OutboxMessageRepository outbox, ObjectMapper mapper,
                                   ApprovalRepository approvals, RequestHistoryRepository history) {
        this.requests = requests; this.outbox = outbox; this.mapper = mapper; this.approvals = approvals; this.history = history;
    }

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
