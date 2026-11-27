package com.northstar.request.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Data transfer record representing a single audit timeline event for a service request.
 *
 * <p><b>Purpose:</b> Communicates event actor, action performed (CREATED, APPROVED, REJECTED, CANCELLED, STATUS_UPDATED),
 * previous status, target status, reason comment, and creation timestamp.
 *
 * <p><b>Downstream / Workflow:</b> Returned by {@code GET /api/requests/{id}/history} to render the request timeline.
 */
public record RequestHistoryResponse(
    UUID id,
    String actorId,
    String action,
    String fromStatus,
    String toStatus,
    String comment,
    Instant createdAt
) {}
