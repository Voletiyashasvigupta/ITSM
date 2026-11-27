package com.itsm.changemanagement.dto;

/**
 * Data transfer record capturing change risk assessment and business impact findings.
 *
 * <p><b>Purpose:</b> Binds risk description, business/technical impact, service downtime expectations, and mitigation plans.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/assess} during the ASSESSMENT phase.
 */
public record ChangeAssessmentDTO(
    String riskDescription,
    String businessImpact,
    String technicalImpact,
    Boolean serviceDowntimeExpected,
    String riskMitigationPlan,
    String performedBy
) {}
