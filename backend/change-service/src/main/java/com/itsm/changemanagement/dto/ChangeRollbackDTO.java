package com.itsm.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Data transfer record capturing rollback actions and reasons.
 *
 * <p><b>Purpose:</b> Binds rollback reason, execution notes, technician name, and rollback status.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/rollback} when a change fails validation.
 */
public record ChangeRollbackDTO(
    @NotBlank String reason,
    String notes,
    String performedBy,
    String status
) {}
