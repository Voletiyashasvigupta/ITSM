package com.itsm.changemanagement.dto;

/**
 * Data transfer record tracking implementation progress and outcomes.
 *
 * <p><b>Purpose:</b> Binds progress percentage (0-100), work notes, outcome status, and engineer name.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/implementation} during IN_PROGRESS execution.
 */
public record ChangeImplementationDTO(
    Integer progress,
    String notes,
    String outcome,
    String performedBy
) {}
