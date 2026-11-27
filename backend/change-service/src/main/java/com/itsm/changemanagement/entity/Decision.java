package com.itsm.changemanagement.entity;

/**
 * Enumeration representing approval decisions for change requests.
 *
 * <p><b>Purpose:</b> Records approval status: PENDING, APPROVED, or REJECTED.
 *
 * <p><b>Downstream / Workflow:</b> Logged in CAB approval votes and change audit trails.
 */
public enum Decision {
    PENDING,
    APPROVED,
    REJECTED
}
