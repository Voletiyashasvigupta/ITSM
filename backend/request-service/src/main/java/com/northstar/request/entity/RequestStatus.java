package com.northstar.request.entity;

/**
 * Enumeration representing the lifecycle states of a service request in Northstar.
 *
 * <p><b>Purpose:</b> Models state machine steps:
 * <ul>
 *   <li>{@code DRAFT}: Initial creation before formal submission.</li>
 *   <li>{@code SUBMITTED}: Submitted by requester, awaiting approval routing.</li>
 *   <li>{@code PENDING_APPROVAL}: Awaiting decision from the designated approver.</li>
 *   <li>{@code APPROVED}: Approved by manager/approver.</li>
 *   <li>{@code REJECTED}: Rejected with required explanation comment.</li>
 *   <li>{@code IN_PROGRESS}: Under fulfillment.</li>
 *   <li>{@code COMPLETED}: Fulfillment finished.</li>
 *   <li>{@code CANCELLED}: Withdrawn by requester or canceled by supervisor.</li>
 *   <li>{@code FULFILLED}: Completed downstream in ServiceNow.</li>
 *   <li>{@code SYNC_FAILED}: Upstream synchronization attempt failed.</li>
 * </ul>
 *
 * <p><b>Downstream / Workflow:</b> Enforced by {@link com.northstar.request.service.RequestStateMachine}.
 */
public enum RequestStatus {
    DRAFT,
    SUBMITTED,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    FULFILLED,
    SYNC_FAILED
}
