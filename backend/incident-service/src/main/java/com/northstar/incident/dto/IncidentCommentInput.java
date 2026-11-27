package com.northstar.incident.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
/**
 * Data transfer record for posting a new comment to an incident.
 *
 * <p><b>Purpose:</b> Carries validated comment text (max 4000 characters).
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code POST /api/incidents/{id}/comments} and saved as an {@link com.northstar.incident.entity.IncidentCommentEntity}.
 *
 * @param comment Message text.
 */
public record IncidentCommentInput(@NotBlank @Size(max=4000) String comment) {}
