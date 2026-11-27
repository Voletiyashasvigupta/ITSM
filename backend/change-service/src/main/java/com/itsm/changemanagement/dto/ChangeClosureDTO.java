package com.itsm.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Data transfer record capturing final closure and Post Implementation Review (PIR) details.
 *
 * <p><b>Purpose:</b> Binds closure notes, closed-by user, final outcome, and PIR summary.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/close} to transition RFC to CLOSED.
 */
public record ChangeClosureDTO(
    @NotBlank String closureNotes,
    @NotBlank String closedBy,
    String finalOutcome,
    String postImplementationReview
) {}
