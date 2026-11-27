package com.itsm.changemanagement.dto;

/**
 * Data transfer record for updating core fields of a draft change request.
 *
 * <p><b>Purpose:</b> Permits modifications to descriptions and plans before final submission.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}} and handled by {@link com.itsm.changemanagement.service.ChangeService#updateChange(Long, UpdateChangeRequestDTO, String)}.
 */
public record UpdateChangeRequestDTO(
    String shortDescription,
    String detailedDescription,
    String businessJustification,
    String implementationPlan,
    String rollbackPlan,
    String testPlan
) {}
