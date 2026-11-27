package com.itsm.changemanagement.entity;

/**
 * Enumeration representing all lifecycle phases of an ITIL Change Request.
 *
 * <p><b>Purpose:</b> Models the complete state machine: Draft -> Submitted -> Assessment -> Under Review ->
 * Pending Approval -> Approved / Rejected -> Scheduled -> In Progress -> Implemented ->
 * Pending Validation -> Validated -> Closed (or Rollback/Cancelled/On Hold).
 *
 * <p><b>Downstream / Workflow:</b> Enforced by {@link com.itsm.changemanagement.service.ChangeService} state transition rules.
 */
public enum ChangeStatus {
    DRAFT,
    SUBMITTED,
    ASSESSMENT,
    UNDER_REVIEW,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    SCHEDULED,
    IN_PROGRESS,
    IMPLEMENTED,
    PENDING_VALIDATION,
    VALIDATED,
    ROLLBACK_IN_PROGRESS,
    ROLLED_BACK,
    CLOSED,
    CANCELLED,
    ON_HOLD,
    ADDITIONAL_INFORMATION_REQUIRED
}
