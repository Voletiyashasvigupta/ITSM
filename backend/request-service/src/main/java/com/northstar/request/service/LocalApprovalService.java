package com.northstar.request.service;

import com.northstar.request.client.AuthServiceClient;
import com.northstar.request.entity.ApprovalEntity;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.dto.ApprovalResponse;
import com.northstar.request.integration.ServiceNowRequestClient;
import com.northstar.request.repository.ApprovalRepository;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service interface governing request approval workflows with reporting hierarchy enforcement.
 */
public interface LocalApprovalService {

    /**
     * Lists requests currently awaiting the actor's decision or within their reporting hierarchy.
     */
    List<ApprovalResponse> pending(String actor, boolean isAdmin, boolean isManager);

    /**
     * Lists historical approval decisions decided by the actor or their hierarchy.
     */
    List<ApprovalResponse> history(String actor, boolean isAdmin, boolean isManager);

    /**
     * Retrieves a single approval record by ID.
     */
    ApprovalResponse get(UUID id, String actor, boolean isAdmin, boolean isManager);

    /**
     * Records an approval or rejection decision, strictly enforcing manager hierarchy permissions.
     */
    ApprovalResponse decide(UUID id, String actor, boolean isAdmin, boolean approve, String comment);
}

/**
 * Default implementation of {@link LocalApprovalService}.
 */
@Service
class LocalApprovalServiceImpl implements LocalApprovalService {
    private final ApprovalRepository approvals;
    private final ServiceRequestRepository requests;
    private final RequestHistoryRepository history;
    private final RequestStateMachine stateMachine;
    private final ServiceNowRequestClient serviceNowClient;
    private final AuthServiceClient authClient;

    LocalApprovalServiceImpl(ApprovalRepository a, ServiceRequestRepository r, RequestHistoryRepository h,
                             RequestStateMachine stateMachine, ServiceNowRequestClient serviceNowClient,
                             AuthServiceClient authClient) {
        this.approvals = a;
        this.requests = r;
        this.history = h;
        this.stateMachine = stateMachine;
        this.serviceNowClient = serviceNowClient;
        this.authClient = authClient;
    }

    @Override
    public List<ApprovalResponse> pending(String actor, boolean isAdmin, boolean isManager) {
        if (isAdmin) {
            return approvals.findByDecisionOrderByCreatedAtDesc("PENDING").stream()
                    .map(this::view).toList();
        }
        if (isManager) {
            List<ApprovalEntity> directlyAssigned = approvals.findByApproverIdAndDecisionOrderByCreatedAtDesc(actor, "PENDING");
            Set<UUID> seenApprovalIds = directlyAssigned.stream().map(ApprovalEntity::getId).collect(Collectors.toSet());
            List<ApprovalEntity> allScoped = new ArrayList<>(directlyAssigned);

            List<String> subordinateIds = authClient.getSubordinateIds(actor);
            if (!subordinateIds.isEmpty()) {
                List<ApprovalEntity> pendingAcrossOrg = approvals.findByDecisionOrderByCreatedAtDesc("PENDING");
                for (ApprovalEntity app : pendingAcrossOrg) {
                    if (!seenApprovalIds.contains(app.getId())) {
                        requests.findById(app.getRequestId()).ifPresent(req -> {
                            if (subordinateIds.contains(req.getRequestedForId()) || subordinateIds.contains(req.getRequesterId())) {
                                seenApprovalIds.add(app.getId());
                                allScoped.add(app);
                            }
                        });
                    }
                }
            }
            return allScoped.stream().map(this::view).toList();
        }
        return approvals.findByApproverIdAndDecisionOrderByCreatedAtDesc(actor, "PENDING").stream()
                .map(this::view).toList();
    }

    @Override
    public List<ApprovalResponse> history(String actor, boolean isAdmin, boolean isManager) {
        if (isAdmin) {
            return approvals.findAll().stream()
                    .filter(a -> !"PENDING".equals(a.getDecision()))
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(this::view).toList();
        }
        return approvals.findByApproverIdOrderByCreatedAtDesc(actor).stream()
                .filter(a -> !"PENDING".equals(a.getDecision()))
                .map(this::view).toList();
    }

    @Override
    public ApprovalResponse get(UUID id, String actor, boolean isAdmin, boolean isManager) {
        ApprovalEntity a = approvals.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found"));
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        boolean participant = a.getApproverId().equals(actor) || r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor);
        if (participant || isAdmin) return view(a);
        if (isManager && (authClient.isSubordinate(actor, r.getRequestedForId()) || authClient.isSubordinate(actor, r.getRequesterId()))) {
            return view(a);
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to approval record");
    }

    @Override
    @Transactional
    public ApprovalResponse decide(UUID id, String actor, boolean isAdmin, boolean approve, String comment) {
        ApprovalEntity a = approvals.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found"));
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        // Strictly enforce reporting hierarchy: Manager can only approve requests for employees within their assigned reporting hierarchy
        boolean authorized = isAdmin
                || a.getApproverId().equals(actor)
                || authClient.isSubordinate(actor, r.getRequestedForId())
                || authClient.isSubordinate(actor, r.getRequesterId());

        if (!authorized) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Manager can only approve requests for employees within their assigned reporting hierarchy");
        }

        if (!"PENDING".equals(a.getDecision())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Approval has already been decided");
        }
        if (!approve && (comment == null || comment.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A comment is required when rejecting");
        }

        RequestStatus target = approve ? RequestStatus.APPROVED : RequestStatus.REJECTED;
        RequestStatus from = r.getStatus();
        stateMachine.require(from, target);
        a.decide(approve ? "APPROVED" : "REJECTED", comment == null ? null : comment.trim());
        r.setStatus(target);
        history.save(new RequestHistoryEntity(r.getId(), actor, approve ? "APPROVED" : "REJECTED", from.name(), target.name(), comment));

        if (r.getExternalId() != null && !r.getExternalId().isBlank()) {
            Map<String, Object> snUpdate = new HashMap<>();
            snUpdate.put("approval", approve ? "approved" : "rejected");
            snUpdate.put("state", approve ? "2" : "4");
            snUpdate.put("work_notes", (approve ? "Approved" : "Rejected") + " by " + actor + " in Service Hub" + (comment != null && !comment.isBlank() ? ": " + comment.trim() : ""));
            serviceNowClient.updateRequest(r.getExternalId(), snUpdate);
        }

        return view(a);
    }

    private ApprovalResponse view(ApprovalEntity a) {
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow();
        return new ApprovalResponse(a.getId(), r.getId(), r.getRequestNumber(), r.getServiceName(), r.getRequesterId(),
                a.getApproverId(), a.getDecision(), a.getComment(), a.getCreatedAt(), a.getDecidedAt());
    }
}
