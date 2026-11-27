package com.itsm.changemanagement.entity;

/**
 * Enumeration representing assessed operational risk of an RFC.
 *
 * <p><b>Purpose:</b> Quantifies change impact on production systems: LOW, MEDIUM, HIGH, CRITICAL.
 *
 * <p><b>Downstream / Workflow:</b> Evaluated in risk matrices to decide CAB escalation levels.
 */
public enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
