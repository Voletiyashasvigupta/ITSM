package com.northstar.incident.dto;

import jakarta.validation.constraints.Size;

/**
 * Data transfer record containing input payload fields for creating or updating an incident.
 *
 * <p><b>Purpose:</b> Binds form inputs submitted by employees or support agents, accommodating both modern ITIL
 * attributes and legacy short description/title fields.
 *
 * <p><b>Downstream / Workflow:</b> Passed to {@link com.northstar.incident.service.LocalIncidentService#createIncident(IncidentInput, String)}
 * and {@link com.northstar.incident.service.LocalIncidentService#updateIncident(java.util.UUID, IncidentInput)}.
 */
public record IncidentInput(
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
    @Size(max = 255) String shortDescription,
    @Size(max = 200) String title,
    @Size(max = 10000) String description
) {
    /**
     * Resolves the effective short description from either the shortDescription or title fields with a sensible default.
     *
     * <p><b>Purpose:</b> Normalizes title inputs across frontend client variations.
     *
     * <p><b>Downstream / Workflow:</b> Used during entity population.
     *
     * @return Trimmed non-blank short description.
     */
    public String effectiveShortDescription() {
        if (shortDescription != null && !shortDescription.isBlank()) return shortDescription.trim();
        if (title != null && !title.isBlank()) return title.trim();
        return "Incident";
    }
}
