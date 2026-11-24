package com.northstar.incident.dto;

public record IncidentStatusInput(
    String status,
    String state,
    String assigneeId,
    String assignedTo,
    String impact,
    String urgency,
    String priority
) {}
