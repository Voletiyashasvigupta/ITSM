package com.northstar.request.service;

import com.northstar.request.entity.ApprovalEntity;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.dto.ApprovalResponse;
import com.northstar.request.repository.ApprovalRepository;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service interface governing request approval workflows.
 *
 * <p><b>Purpose:</b> Declares contract for listing pending approvals, querying decision history,
 * inspecting single approval details, and applying approve/reject decisions with mandatory comment validation.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.request.controller.ApprovalsController}.
 */
public interface LocalApprovalService {

    /**
     * Lists requests currently awaiting the actor's decision.
     *
     * @param actor Approver subject ID.
     * @param manager Whether actor is a manager.
     * @return List of pending ApprovalResponse DTOs.
     */
    java.util.List<ApprovalResponse> pending(String actor, boolean manager);

    /**
     * Lists historical approval decisions decided by the actor.
     *
     * @param actor Approver subject ID.
     * @param manager Whether actor is a manager.
     * @return List of historical ApprovalResponse DTOs.
     */
    java.util.List<ApprovalResponse> history(String actor, boolean manager);

    /**
     * Retrieves a single approval record by ID.
     *
     * @param id Approval UUID.
     * @param actor User subject ID.
     * @param manager Whether actor is manager.
     * @return ApprovalResponse.
     */
    ApprovalResponse get(UUID id, String actor, boolean manager);

    /**
     * Records an approval or rejection decision.
     *
     * <p><b>Purpose:</b> Validates that the actor matches the designated approver, that the approval is still PENDING,
     * enforces a non-empty comment on rejection, updates the approval row, transitions the request status in {@link RequestStateMachine},
     * and writes a {@link RequestHistoryEntity} audit entry.
     *
     * @param id Approval UUID.
     * @param actor Approver subject ID.
     * @param approve {@code true} to approve; {@code false} to reject.
     * @param comment Reason comment (mandatory on rejection).
     * @return Updated ApprovalResponse.
     */
    ApprovalResponse decide(UUID id, String actor, boolean approve, String comment);
}

/**
 * Default implementation of {@link LocalApprovalService}.
 *
 * <p><b>Purpose:</b> Coordinates {@link ApprovalRepository}, {@link ServiceRequestRepository}, and {@link RequestHistoryRepository}.
 */
@Service
class LocalApprovalServiceImpl implements LocalApprovalService {
    private final ApprovalRepository approvals;
    private final ServiceRequestRepository requests;
    private final RequestHistoryRepository history;
    private final RequestStateMachine stateMachine;

    LocalApprovalServiceImpl(ApprovalRepository a, ServiceRequestRepository r, RequestHistoryRepository h, RequestStateMachine stateMachine) {
        this.approvals = a;
        this.requests = r;
        this.history = h;
        this.stateMachine = stateMachine;
    }

    @Override
    public java.util.List<ApprovalResponse> pending(String actor, boolean manager) {
        return list(actor, manager, true);
    }

    @Override
    public java.util.List<ApprovalResponse> history(String actor, boolean manager) {
        return list(actor, manager, false);
    }

    @Override
    public ApprovalResponse get(UUID id, String actor, boolean manager) {
        ApprovalEntity a = approvals.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found"));
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        boolean participant = a.getApproverId().equals(actor) || r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor);
        if (!manager && !participant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to approval record");
        return view(a);
    }

    private java.util.List<ApprovalResponse> list(String actor, boolean manager, boolean pending) {
        var rows = pending
                ? approvals.findByApproverIdAndDecisionOrderByCreatedAtDesc(actor, "PENDING")
                : approvals.findByApproverIdOrderByCreatedAtDesc(actor);
        return rows.stream().filter(a -> !pending || a.getDecision().equals("PENDING")).map(this::view).toList();
    }

    @Override
    @Transactional
    public ApprovalResponse decide(UUID id, String actor, boolean approve, String comment) {
        ApprovalEntity a = approvals.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found"));
        if (!a.getApproverId().equals(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned approver can decide");
        if (!"PENDING".equals(a.getDecision())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Approval has already been decided");
        if (!approve && (comment == null || comment.isBlank())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A comment is required when rejecting");
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        RequestStatus target = approve ? RequestStatus.APPROVED : RequestStatus.REJECTED;
        RequestStatus from = r.getStatus();
        stateMachine.require(from, target);
        a.decide(approve ? "APPROVED" : "REJECTED", comment == null ? null : comment.trim());
        r.setStatus(target);
        history.save(new RequestHistoryEntity(r.getId(), actor, approve ? "APPROVED" : "REJECTED", from.name(), target.name(), comment));
        return view(a);
    }

    private ApprovalResponse view(ApprovalEntity a) {
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow();
        return new ApprovalResponse(a.getId(), r.getId(), r.getRequestNumber(), r.getServiceName(), r.getRequesterId(),
                a.getApproverId(), a.getDecision(), a.getComment(), a.getCreatedAt(), a.getDecidedAt());
    }
}
