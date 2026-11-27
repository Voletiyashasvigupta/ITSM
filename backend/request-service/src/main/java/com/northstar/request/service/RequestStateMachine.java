package com.northstar.request.service;

import com.northstar.request.entity.RequestStatus;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * State machine validator governing permissible lifecycle transitions for service requests.
 *
 * <p><b>Purpose:</b> Enforces business transition rules:
 * <ul>
 *   <li>DRAFT -> SUBMITTED, CANCELLED</li>
 *   <li>SUBMITTED -> PENDING_APPROVAL, APPROVED, REJECTED, IN_PROGRESS, COMPLETED, FULFILLED, CANCELLED, SYNC_FAILED</li>
 *   <li>PENDING_APPROVAL -> APPROVED, REJECTED, CANCELLED, SYNC_FAILED</li>
 *   <li>APPROVED -> IN_PROGRESS, CANCELLED, FULFILLED, SYNC_FAILED</li>
 *   <li>IN_PROGRESS -> COMPLETED, FULFILLED, SYNC_FAILED</li>
 *   <li>SYNC_FAILED -> SUBMITTED, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED</li>
 * </ul>
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link LocalRequestService} and {@link LocalApprovalService}
 * to prevent illegal state changes.
 */
@Component
public class RequestStateMachine {

    private static final Map<RequestStatus, Set<RequestStatus>> ALLOWED = Map.of(
        RequestStatus.DRAFT, Set.of(RequestStatus.SUBMITTED, RequestStatus.CANCELLED),
        RequestStatus.SUBMITTED, Set.of(RequestStatus.PENDING_APPROVAL, RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.IN_PROGRESS, RequestStatus.COMPLETED, RequestStatus.FULFILLED, RequestStatus.CANCELLED, RequestStatus.SYNC_FAILED),
        RequestStatus.PENDING_APPROVAL, Set.of(RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CANCELLED, RequestStatus.SYNC_FAILED),
        RequestStatus.APPROVED, Set.of(RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED, RequestStatus.FULFILLED, RequestStatus.SYNC_FAILED),
        RequestStatus.IN_PROGRESS, Set.of(RequestStatus.COMPLETED, RequestStatus.FULFILLED, RequestStatus.SYNC_FAILED),
        RequestStatus.SYNC_FAILED, Set.of(RequestStatus.SUBMITTED, RequestStatus.PENDING_APPROVAL, RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CANCELLED));

    /**
     * Checks if a transition from one status to another is permitted.
     *
     * @param from Origin status.
     * @param to Target status.
     * @return {@code true} if allowed.
     */
    public boolean allows(RequestStatus from, RequestStatus to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }

    /**
     * Asserts that a status transition is permitted, throwing 409 Conflict if disallowed.
     *
     * @param from Origin status.
     * @param to Target status.
     */
    public void require(RequestStatus from, RequestStatus to) {
        if (!allows(from, to)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Illegal request status transition: " + from + " -> " + to);
        }
    }
}
