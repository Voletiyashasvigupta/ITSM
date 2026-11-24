package com.northstar.incident.dto;

import java.time.Instant;
import java.util.UUID;

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
