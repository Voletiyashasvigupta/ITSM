package com.northstar.request.dto;

import com.northstar.request.entity.RequestStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Data transfer record acknowledging successful submission of a service request.
 *
 * <p><b>Purpose:</b> Confirms ticket persistence with HTTP 202 Accepted, returning request UUID, REQ number,
 * initial status (SUBMITTED / PENDING_APPROVAL), and creation timestamp.
 *
 * <p><b>Downstream / Workflow:</b> Sent in the HTTP 202 response to {@code POST /api/requests}.
 */
public record RequestSubmissionResponse(
    UUID id,
    String requestNumber,
    String serviceName,
    String requesterId,
    String requestedForId,
    RequestStatus status,
    String serviceNowNumber,
    Instant createdAt
) {}
