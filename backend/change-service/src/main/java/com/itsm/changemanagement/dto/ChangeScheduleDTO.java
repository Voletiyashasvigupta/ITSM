package com.itsm.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Data transfer record defining the approved change implementation schedule and window.
 *
 * <p><b>Purpose:</b> Binds start/end timestamps, maintenance window name, and scheduler identity.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/schedule} to transition RFC to SCHEDULED.
 */
public record ChangeScheduleDTO(
    @NotBlank String plannedStartDate,
    @NotBlank String plannedEndDate,
    String maintenanceWindow,
    @NotBlank String scheduledBy
) {}
