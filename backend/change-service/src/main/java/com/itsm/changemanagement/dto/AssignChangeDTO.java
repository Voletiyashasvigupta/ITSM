package com.itsm.changemanagement.dto;

/**
 * Data transfer record for assigning operational roles to a change request.
 *
 * <p><b>Purpose:</b> Specifies change analyst, technical team, implementation team, and change manager.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/assign} and saved to {@link com.itsm.changemanagement.entity.ChangeRequest}.
 */
public record AssignChangeDTO(
    String changeAnalyst,
    String technicalTeam,
    String implementationTeam,
    String changeManager
) {}
