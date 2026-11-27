package com.northstar.request.dto;

import com.northstar.request.entity.RequestStatus;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Data transfer record providing complete details for a service request.
 *
 * <p><b>Purpose:</b> Communicates request identifiers (UUID, REQ number), service name, description,
 * participant IDs (requester, requested-for, approver), lifecycle {@link RequestStatus}, external synchronization IDs,
 * custom form fields, and timestamps.
 *
 * <p><b>Downstream / Workflow:</b> Returned by {@code GET /api/requests/{id}} and list queries to render request cards and detail views.
 */
public record RequestDetailsResponse(
    UUID id,
    String requestNumber,
    String serviceName,
    String description,
    String requesterId,
    String requestedForId,
    String approverId,
    RequestStatus status,
    String externalId,
    String externalSystem,
    Map<String, String> fields,
    Instant createdAt,
    Instant updatedAt
) {}
