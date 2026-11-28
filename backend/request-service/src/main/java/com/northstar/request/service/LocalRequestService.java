package com.northstar.request.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.request.client.AuthServiceClient;
import com.northstar.request.dto.RequestDetailsResponse;
import com.northstar.request.dto.RequestHistoryResponse;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import com.northstar.request.integration.ServiceNowRequestClient;
import com.northstar.request.integration.ServiceNowStatusMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service interface governing local request retrieval, cancellation, audit history, and state transitions
 * with reporting hierarchy scoping for managers.
 */
public interface LocalRequestService {

    /**
     * Lists paginated requests visible to the actor based on role and reporting hierarchy.
     */
    Page<RequestDetailsResponse> list(String actor, boolean isAdmin, boolean isManager, Pageable pageable);

    /**
     * Retrieves full details for a request, verifying view permissions against hierarchy.
     */
    RequestDetailsResponse get(UUID id, String actor, boolean isAdmin, boolean isManager);

    /**
     * Retrieves the chronological timeline history for a request.
     */
    List<RequestHistoryResponse> history(UUID id, String actor, boolean isAdmin, boolean isManager);

    /**
     * Transitions a request to a target status according to state machine rules.
     */
    RequestDetailsResponse transition(UUID id, String actor, RequestStatus target);

    /**
     * Cancels an eligible request.
     */
    RequestDetailsResponse cancel(UUID id, String actor, boolean isAdmin, boolean isManager);

    /**
     * Synchronizes request state, approval, and timeline with live ServiceNow outcomes.
     */
    RequestDetailsResponse sync(UUID id, String actor, boolean isAdmin, boolean isManager);

    /**
     * Retries ServiceNow synchronization or submission following a failure or outage.
     */
    RequestDetailsResponse retry(UUID id, String actor, boolean isAdmin, boolean isManager);

    /**
     * Generates a sequential request ticket number (REQ0010001).
     */
    String generateNextNumber();
}

/**
 * Default implementation of {@link LocalRequestService}.
 */
@Service
class LocalRequestServiceImpl implements LocalRequestService {
    private final ServiceRequestRepository requests;
    private final RequestHistoryRepository history;
    private final ObjectMapper mapper;
    private final RequestStateMachine stateMachine;
    private final AuthServiceClient authClient;
    private final ServiceNowRequestClient serviceNowClient;
    private final ServiceNowStatusMapper statusMapper;

    LocalRequestServiceImpl(ServiceRequestRepository requests, RequestHistoryRepository history, ObjectMapper mapper,
                            RequestStateMachine stateMachine, AuthServiceClient authClient,
                            ServiceNowRequestClient serviceNowClient) {
        this(requests, history, mapper, stateMachine, authClient, serviceNowClient, new ServiceNowStatusMapper());
    }

    @org.springframework.beans.factory.annotation.Autowired
    LocalRequestServiceImpl(ServiceRequestRepository requests, RequestHistoryRepository history, ObjectMapper mapper,
                            RequestStateMachine stateMachine, AuthServiceClient authClient,
                            ServiceNowRequestClient serviceNowClient, ServiceNowStatusMapper statusMapper) {
        this.requests = requests;
        this.history = history;
        this.mapper = mapper;
        this.stateMachine = stateMachine;
        this.authClient = authClient;
        this.serviceNowClient = serviceNowClient;
        this.statusMapper = statusMapper != null ? statusMapper : new ServiceNowStatusMapper();
    }

    @Override
    public Page<RequestDetailsResponse> list(String actor, boolean isAdmin, boolean isManager, Pageable pageable) {
        if (isAdmin) {
            return requests.findByServiceNameNotOrRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(
                    "People support", actor, actor, actor, pageable).map(this::toResponse);
        }
        if (isManager) {
            List<String> subordinates = authClient.getSubordinateIds(actor);
            if (!subordinates.isEmpty()) {
                List<String> scopedActors = new ArrayList<>(subordinates);
                scopedActors.add(actor);
                return requests.findByRequesterIdInOrRequestedForIdInOrApproverIdOrderByCreatedAtDesc(
                        scopedActors, scopedActors, actor, pageable).map(this::toResponse);
            }
        }
        return requests.findByRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(
                actor, actor, actor, pageable).map(this::toResponse);
    }

    @Override
    public RequestDetailsResponse get(UUID id, String actor, boolean isAdmin, boolean isManager) {
        ServiceRequestEntity r = find(id);
        assertRead(r, actor, isAdmin, isManager);
        if ("servicenow".equalsIgnoreCase(r.getExternalSystem()) && r.getExternalId() != null && !r.getExternalId().isBlank()) {
            try {
                return sync(id, actor, isAdmin, isManager);
            } catch (Exception ignored) {}
        }
        return toResponse(r);
    }

    @Override
    @Transactional
    public RequestDetailsResponse sync(UUID id, String actor, boolean isAdmin, boolean isManager) {
        ServiceRequestEntity r = find(id);
        assertRead(r, actor, isAdmin, isManager);
        if (!"servicenow".equalsIgnoreCase(r.getExternalSystem()) || r.getExternalId() == null || r.getExternalId().isBlank()) {
            return toResponse(r);
        }
        try {
            Map<String, Object> snData = serviceNowClient.getRequest(r.getExternalId());
            if (snData != null) {
                String snState = snData.get("state") != null ? String.valueOf(snData.get("state")).trim() : "";
                String snStage = snData.get("stage") != null ? String.valueOf(snData.get("stage")).trim() : "";
                String snApproval = snData.get("approval") != null ? String.valueOf(snData.get("approval")).trim() : "";

                Map<String, String> fields = new HashMap<>();
                if (r.getFieldsJson() != null && !r.getFieldsJson().isBlank()) {
                    try {
                        fields = new HashMap<>(mapper.readValue(r.getFieldsJson(), new TypeReference<Map<String, String>>() {}));
                    } catch (Exception ignored) {}
                }
                if (!snApproval.isBlank()) fields.put("serviceNowApproval", snApproval);
                if (!snStage.isBlank()) fields.put("serviceNowStage", snStage);
                if (!snState.isBlank()) fields.put("serviceNowState", snState);

                if (snData.get("assignment_group") != null) {
                    Object grp = snData.get("assignment_group");
                    String grpStr = grp instanceof Map<?, ?> m ? String.valueOf(m.get("display_value") != null ? m.get("display_value") : m.get("value")) : String.valueOf(grp);
                    if (!grpStr.isBlank() && !"null".equalsIgnoreCase(grpStr)) fields.put("serviceNowAssignmentGroup", grpStr);
                }
                if (snData.get("assigned_to") != null) {
                    Object usr = snData.get("assigned_to");
                    String usrStr = usr instanceof Map<?, ?> m ? String.valueOf(m.get("display_value") != null ? m.get("display_value") : m.get("value")) : String.valueOf(usr);
                    if (!usrStr.isBlank() && !"null".equalsIgnoreCase(usrStr)) fields.put("serviceNowAssignedTo", usrStr);
                }
                try {
                    r.setFieldsJson(mapper.writeValueAsString(fields));
                } catch (Exception ignored) {}

                RequestStatus current = r.getStatus();
                RequestStatus target = statusMapper.mapToLocalStatus(snApproval, snState, snStage, current);

                if (target != null && target != current) {
                    r.setStatus(target);
                    history.save(new RequestHistoryEntity(id, "servicenow", "SERVICENOW_SYNC", current.name(), target.name(),
                            "Synced with ServiceNow (state=" + snState + ", stage=" + snStage + ", approval=" + snApproval + ")"));
                }
                r = requests.save(r);
            }
        } catch (Exception ex) {
            // Keep existing status if sync attempt encounters network issues
        }
        return toResponse(r);
    }

    @Override
    @Transactional
    public RequestDetailsResponse retry(UUID id, String actor, boolean isAdmin, boolean isManager) {
        ServiceRequestEntity r = find(id);
        assertRead(r, actor, isAdmin, isManager);

        Map<String, String> fields = new HashMap<>();
        if (r.getFieldsJson() != null && !r.getFieldsJson().isBlank()) {
            try {
                fields = new HashMap<>(mapper.readValue(r.getFieldsJson(), new TypeReference<Map<String, String>>() {}));
            } catch (Exception ignored) {}
        }

        // If already synced with valid external ID, just run sync to refresh state
        if ("servicenow".equalsIgnoreCase(r.getExternalSystem()) && r.getExternalId() != null && !r.getExternalId().isBlank()) {
            return sync(id, actor, isAdmin, isManager);
        }

        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", r.getServiceName());
            snPayload.put("correlation_id", r.getIdempotencyKey());
            snPayload.put("variables", new HashMap<>(fields));
            snPayload.put("requested_for", r.getRequestedForId());

            String catItemId = fields.get("cat_item");
            if (catItemId == null || catItemId.isBlank()) catItemId = fields.get("catalogItemId");
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
                    r.setServiceNowNumber(primaryNum);
                    fields.put("serviceNowNumber", primaryNum);
                }
                if (reqNum != null) fields.put("serviceNowReqNumber", reqNum);
                if (ritmNum != null) fields.put("serviceNowRitmNumber", ritmNum);
                if (snResponse.get("request_sys_id") != null) fields.put("serviceNowReqSysId", String.valueOf(snResponse.get("request_sys_id")));
                if (snResponse.get("ritm_sys_id") != null) fields.put("serviceNowRitmSysId", String.valueOf(snResponse.get("ritm_sys_id")));

                if (primarySysId != null && !primarySysId.isBlank() && !"null".equals(primarySysId)) {
                    r.setExternalLink(primarySysId, "servicenow");
                }
                fields.put("syncStatus", "SYNCED");
                fields.remove("syncError");
                fields.remove("nextSyncAttemptAt");
                r.setFieldsJson(mapper.writeValueAsString(fields));
                r = requests.save(r);

                history.save(new RequestHistoryEntity(id, actor, "SERVICENOW_MANUAL_RETRY_SUCCESS", null, r.getStatus().name(),
                        "Manual retry succeeded. Created ServiceNow record: " + primaryNum));
            }
        } catch (Exception ex) {
            int attempts = 1;
            try {
                if (fields.get("syncAttempts") != null) attempts = Integer.parseInt(fields.get("syncAttempts")) + 1;
            } catch (Exception ignored) {}
            fields.put("syncAttempts", String.valueOf(attempts));
            fields.put("syncStatus", attempts >= 5 ? "FAILED" : "PENDING_RETRY");
            fields.put("syncError", ex.getMessage() != null ? ex.getMessage() : ex.toString());
            try {
                r.setFieldsJson(mapper.writeValueAsString(fields));
            } catch (Exception ignored) {}
            requests.save(r);

            history.save(new RequestHistoryEntity(id, actor, "SERVICENOW_MANUAL_RETRY_FAILED", null, r.getStatus().name(),
                    "Manual retry failed: " + ex.getMessage()));
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ServiceNow retry failed: " + ex.getMessage());
        }
        return toResponse(r);
    }

    @Override
    public String generateNextNumber() {
        long count = requests.count();
        return String.format("REQ%07d", 10001 + count);
    }

    @Override
    public List<RequestHistoryResponse> history(UUID id, String actor, boolean isAdmin, boolean isManager) {
        ServiceRequestEntity r = find(id);
        assertRead(r, actor, isAdmin, isManager);
        return history.findByRequestIdOrderByCreatedAtAsc(id).stream()
                .map(h -> new RequestHistoryResponse(h.getId(), h.getActorId(), h.getAction(), h.getFromStatus(), h.getToStatus(), h.getComment(), h.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional
    public RequestDetailsResponse transition(UUID id, String actor, RequestStatus target) {
        ServiceRequestEntity r = find(id);
        if ("People support".equals(r.getServiceName()) && !r.getRequesterId().equals(actor) && !r.getRequestedForId().equals(actor) && !Objects.equals(r.getApproverId(), actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Confidential People support request access is restricted");
        }
        RequestStatus from = r.getStatus();
        stateMachine.require(from, target);
        r.setStatus(target);
        history.save(new RequestHistoryEntity(id, actor, "STATUS_CHANGED", from.name(), target.name(), null));
        return toResponse(r);
    }

    @Override
    @Transactional
    public RequestDetailsResponse cancel(UUID id, String actor, boolean isAdmin, boolean isManager) {
        ServiceRequestEntity r = find(id);
        boolean isOwner = r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor);
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the requester or an administrator can cancel a request");
        }
        RequestStatus from = r.getStatus();
        RequestStatus target = RequestStatus.CANCELLED;
        stateMachine.require(from, target);
        r.setStatus(target);
        history.save(new RequestHistoryEntity(id, actor, "CANCELLED", from.name(), target.name(), "Canceled by user"));
        return toResponse(r);
    }

    private ServiceRequestEntity find(UUID id) {
        return requests.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
    }

    private void assertRead(ServiceRequestEntity r, String actor, boolean isAdmin, boolean isManager) {
        boolean participant = r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor) || Objects.equals(r.getApproverId(), actor);
        if (participant) return;
        if ("People support".equals(r.getServiceName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Confidential People support request access is restricted");
        }
        if (isAdmin) return;
        if (isManager && (authClient.isSubordinate(actor, r.getRequestedForId()) || authClient.isSubordinate(actor, r.getRequesterId()))) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to request record");
    }

    private RequestDetailsResponse toResponse(ServiceRequestEntity entity) {
        Map<String, String> fields = Map.of();
        if (entity.getFieldsJson() != null && !entity.getFieldsJson().isBlank()) {
            try {
                fields = mapper.readValue(entity.getFieldsJson(), new TypeReference<Map<String, String>>() {});
            } catch (Exception ignored) {}
        }
        return new RequestDetailsResponse(
                entity.getId(),
                entity.getRequestNumber(),
                entity.getServiceName(),
                entity.getDescription(),
                entity.getRequesterId(),
                entity.getRequestedForId(),
                entity.getApproverId(),
                entity.getStatus(),
                entity.getExternalId(),
                entity.getExternalSystem(),
                fields,
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
