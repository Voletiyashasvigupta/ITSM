package com.northstar.incident.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Data transfer record summarizing an incident ticket for list and table displays.
 *
 * <p><b>Purpose:</b> Exposes ITIL attributes, legacy compatibility fields, and assignment state to frontend clients.
 *
 * <p><b>Downstream / Workflow:</b> Returned by {@code GET /api/incidents} and embedded in {@link IncidentDetailResponse}.
 */
public record IncidentResponse(
    UUID id,
    String incidentNumber,
    String caller,
    String category,
    String subcategory,
    String service,
    String serviceOffering,
    String channel,
    String state,
    String impact,
    String urgency,
    String priority,
    String assignedTo,
    String shortDescription,
    String description,
    String title,
    String status,
    String reporterId,
    String assigneeId,
    Instant createdAt,
    Instant updatedAt
) {}
