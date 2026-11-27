package com.northstar.incident.dto;

/**
 * Data transfer record for updating incident status, state, priority, and assignment.
 *
 * <p><b>Purpose:</b> Supports partial status updates and assignments from incident triage boards.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PATCH /api/incidents/{id}/status} and applied by {@link com.northstar.incident.service.LocalIncidentService#updateIncidentStatus(java.util.UUID, IncidentStatusInput)}.
 */
public record IncidentStatusInput(
    String status,
    String state,
    String assigneeId,
    String assignedTo,
    String impact,
    String urgency,
    String priority
) {}
