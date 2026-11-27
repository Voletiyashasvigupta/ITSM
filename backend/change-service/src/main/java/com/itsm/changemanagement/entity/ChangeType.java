package com.itsm.changemanagement.entity;

/**
 * Enumeration of change types defining the approval and governance rigor required.
 *
 * <p><b>Purpose:</b> Distinguishes between Standard (pre-approved, low risk), Normal (requires CAB review/approval),
 * and Emergency (urgent break-fix requiring ECAB expedited approval).
 *
 * <p><b>Downstream / Workflow:</b> Evaluated in {@link com.itsm.changemanagement.service.ChangeService} to dictate
 * whether CAB assessment steps can be bypassed or require expedited review.
 */
public enum ChangeType {
    STANDARD,
    NORMAL,
    EMERGENCY
}
