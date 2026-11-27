package com.itsm.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Data transfer record capturing CAB or manager approval/rejection decisions.
 *
 * <p><b>Purpose:</b> Binds approver identity, comments, and emergency justification.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/approve} and {@code PUT /api/changes/{id}/reject}.
 */
public record ChangeApprovalDTO(
    @NotBlank String approvedBy,
    String comments,
    String justification
) {}
