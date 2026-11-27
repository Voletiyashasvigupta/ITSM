package com.northstar.request.dto;

import com.northstar.request.entity.RequestStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Data transfer record for manager-initiated request status transitions.
 *
 * <p><b>Purpose:</b> Binds target {@link RequestStatus} enum for lifecycle updates.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PATCH /api/requests/{id}/status} and validated against the request state machine.
 */
public record RequestStatusInput(@NotNull RequestStatus status) {}
