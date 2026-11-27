package com.itsm.changemanagement.entity;

/**
 * Enumeration representing post-implementation validation test status.
 *
 * <p><b>Purpose:</b> Tracks post-change verification results: PENDING, PASSED, or FAILED.
 *
 * <p><b>Downstream / Workflow:</b> When PASSED, allows transition to CLOSED; when FAILED, triggers rollback.
 */
public enum ValidationStatus {
    PENDING,
    PASSED,
    FAILED
}
