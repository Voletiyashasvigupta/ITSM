package com.northstar.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * Data transfer record containing client inputs for submitting a new service request.
 *
 * <p><b>Purpose:</b> Binds service catalog name, description text, requested-for employee ID, chosen approver ID,
 * and custom key-value form fields.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code POST /api/requests} with an {@code Idempotency-Key} header.
 */
public record RequestSubmission(
    @NotBlank @Size(max = 200) String serviceName,
    @NotBlank @Size(max = 10000) String description,
    @Size(max = 128) String requestedForId,
    @Size(max = 128) String approverId,
    Map<String, String> fields
) {}
