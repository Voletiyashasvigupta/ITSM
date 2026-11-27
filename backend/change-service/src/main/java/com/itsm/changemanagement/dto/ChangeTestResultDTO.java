package com.itsm.changemanagement.dto;

import com.itsm.changemanagement.entity.ValidationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Data transfer record capturing post-implementation test execution results.
 *
 * <p><b>Purpose:</b> Binds test log outputs, {@link ValidationStatus} (PASSED/FAILED), tester name, and validation comments.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code PUT /api/changes/{id}/test-results}.
 */
public record ChangeTestResultDTO(
    String testResults,
    @NotNull ValidationStatus validationStatus,
    @NotBlank String testerName,
    String comments
) {}
