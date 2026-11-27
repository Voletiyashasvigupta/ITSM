package com.itsm.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Data transfer record capturing CAB review evaluation and notes.
 *
 * <p><b>Purpose:</b> Binds reviewer name, review feedback comments, and recommended decision.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/review} to record peer/CAB review.
 */
public record ChangeReviewDTO(
    @NotBlank String reviewer,
    @NotBlank String comments,
    String decision
) {}
