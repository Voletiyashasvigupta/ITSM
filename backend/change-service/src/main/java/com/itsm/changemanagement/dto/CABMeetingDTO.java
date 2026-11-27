package com.itsm.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Data transfer record defining a Change Advisory Board (CAB) meeting session.
 *
 * <p><b>Purpose:</b> Stores CAB meeting identifier, name, scheduled date, and chair.
 *
 * <p><b>Downstream / Workflow:</b> Stored in configuration records for CAB scheduling.
 */
public record CABMeetingDTO(
    @NotBlank String key,
    @NotBlank String name,
    String meetingDate,
    String chair
) {}
