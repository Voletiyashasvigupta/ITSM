package com.northstar.request.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.request.dto.RequestDetailsResponse;
import com.northstar.request.dto.RequestHistoryResponse;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
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
 * Service interface governing local request retrieval, cancellation, audit history, and state transitions.
 *
 * <p><b>Purpose:</b> Declares contract for querying requests (with People Support confidentiality scoping),
 * inspecting timelines, canceling pending requests, and progressing status through the state machine.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.request.controller.RequestController}.
 */
public interface LocalRequestService {

    /**
     * Lists paginated requests visible to the actor.
     *
     * @param actor User subject ID.
     * @param manager Whether actor is a manager/admin.
     * @param pageable Pagination settings.
     * @return Page of RequestDetailsResponse.
     */
    Page<RequestDetailsResponse> list(String actor, boolean manager, Pageable pageable);

    /**
     * Retrieves full details for a request, verifying view permissions.
     *
     * @param id Request UUID.
     * @param actor User subject ID.
     * @param manager Whether actor is manager.
     * @return RequestDetailsResponse.
     */
    RequestDetailsResponse get(UUID id, String actor, boolean manager);

    /**
     * Retrieves the chronological timeline history for a request.
     *
     * @param id Request UUID.
     * @param actor User subject ID.
     * @param manager Whether actor is manager.
     * @return List of history entries.
     */
    java.util.List<RequestHistoryResponse> history(UUID id, String actor, boolean manager);

    /**
     * Transitions a request to a target status according to state machine rules.
     *
     * @param id Request UUID.
     * @param actor User subject ID.
     * @param target Target RequestStatus.
     * @return Updated RequestDetailsResponse.
     */
    RequestDetailsResponse transition(UUID id, String actor, RequestStatus target);

    /**
     * Cancels an eligible request.
     *
     * @param id Request UUID.
     * @param actor User subject ID.
     * @param manager Whether actor is manager.
     * @return Updated RequestDetailsResponse.
     */
    RequestDetailsResponse cancel(UUID id, String actor, boolean manager);

    /**
     * Generates a sequential request ticket number (REQ0010001).
     *
     * @return Formatted ticket number.
     */
    String generateNextNumber();
}

/**
 * Default implementation of {@link LocalRequestService}.
 *
 * <p><b>Purpose:</b> Implements privacy scoping (People Support requests are strictly scoped to participants),
 * state validation, history logging, and JSON form deserialization.
 *
 * <p><b>Downstream / Workflow:</b> Interacts with {@link ServiceRequestRepository}, {@link RequestHistoryRepository}, and {@link RequestStateMachine}.
 */
@Service
class LocalRequestServiceImpl implements LocalRequestService {
    private final ServiceRequestRepository requests;
    private final RequestHistoryRepository history;
    private final ObjectMapper mapper;
    private final RequestStateMachine stateMachine;

    LocalRequestServiceImpl(ServiceRequestRepository requests, RequestHistoryRepository history, ObjectMapper mapper, RequestStateMachine stateMachine) {
        this.requests = requests;
        this.history = history;
        this.mapper = mapper;
        this.stateMachine = stateMachine;
    }

    @Override
    public Page<RequestDetailsResponse> list(String actor, boolean manager, Pageable pageable) {
        Page<ServiceRequestEntity> page = manager
                ? requests.findByServiceNameNotOrRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc("People support", actor, actor, actor, pageable)
                : requests.findByRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(actor, actor, actor, pageable);
        return page.map(this::toResponse);
    }

    @Override
    public RequestDetailsResponse get(UUID id, String actor, boolean manager) {
        ServiceRequestEntity r = find(id);
        assertRead(r, actor, manager);
        return toResponse(r);
    }

    @Override
    public String generateNextNumber() {
        long count = requests.count();
        return String.format("REQ%07d", 10001 + count);
    }

    @Override
    public java.util.List<RequestHistoryResponse> history(UUID id, String actor, boolean manager) {
        ServiceRequestEntity r = find(id);
        assertRead(r, actor, manager);
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
    public RequestDetailsResponse cancel(UUID id, String actor, boolean manager) {
        ServiceRequestEntity r = find(id);
        boolean isOwner = r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor);
        if (!manager && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the requester or an administrator can cancel this request");
        }
        RequestStatus from = r.getStatus();
        if (from == RequestStatus.COMPLETED || from == RequestStatus.FULFILLED || from == RequestStatus.REJECTED || from == RequestStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request in status " + from + " cannot be cancelled");
        }
        stateMachine.require(from, RequestStatus.CANCELLED);
        r.setStatus(RequestStatus.CANCELLED);
        history.save(new RequestHistoryEntity(id, actor, "CANCELLED", from.name(), RequestStatus.CANCELLED.name(), "Request cancelled by " + actor));
        return toResponse(r);
    }

    private ServiceRequestEntity find(UUID id) {
        return requests.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
    }

    private void assertRead(ServiceRequestEntity r, String actor, boolean manager) {
        boolean participant = r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor) || Objects.equals(r.getApproverId(), actor);
        if ("People support".equals(r.getServiceName()) && !participant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Confidential People support request access is restricted");
        }
        if (!manager && !participant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this request");
        }
    }

    private RequestDetailsResponse toResponse(ServiceRequestEntity r) {
        Map<String, String> fields = Map.of();
        try {
            if (r.getFieldsJson() != null) fields = mapper.readValue(r.getFieldsJson(), new TypeReference<>() {});
        } catch (Exception ignored) {}
        return new RequestDetailsResponse(r.getId(), r.getRequestNumber(), r.getServiceName(), r.getDescription(),
                r.getRequesterId(), r.getRequestedForId(), r.getApproverId(), r.getStatus(),
                r.getExternalId(), r.getExternalSystem(), fields, r.getCreatedAt(), r.getUpdatedAt());
    }
}
