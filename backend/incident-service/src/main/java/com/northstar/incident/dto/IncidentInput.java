package com.northstar.incident.dto;

import jakarta.validation.constraints.Size;

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
    public String effectiveShortDescription() {
        if (shortDescription != null && !shortDescription.isBlank()) return shortDescription.trim();
        if (title != null && !title.isBlank()) return title.trim();
        return "Incident";
    }
}
