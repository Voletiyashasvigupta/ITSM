package com.itsm.changemanagement.entity;

/**
 * Enumeration representing change urgency/priority tiers.
 *
 * <p><b>Purpose:</b> Categorizes change urgency: LOW, MEDIUM, HIGH, CRITICAL.
 *
 * <p><b>Downstream / Workflow:</b> Controls change scheduling precedence and CAB review urgency.
 */
public enum Priority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
