package com.itsm.changemanagement.dto;

import com.itsm.changemanagement.entity.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/**
 * Data transfer record for creating a new Request for Change (RFC).
 *
 * <p><b>Purpose:</b> Binds input fields from change creation forms: title, detailed description, requester details,
 * type, category, priority, risk, business justification, plans (implementation, rollback, test), planned window, and custom JSON fields.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code POST /api/changes} and passed to {@link com.itsm.changemanagement.service.ChangeService#createChange(CreateChangeRequestDTO)}.
 */
public record CreateChangeRequestDTO(
    @NotBlank @Size(max = 180) String shortDescription,
    @NotBlank String detailedDescription,
    @NotBlank String requestedBy,
    @NotBlank @Email String requesterEmail,
    @NotBlank String department,
    @NotNull ChangeType changeType,
    @NotNull ChangeCategory category,
    @NotNull Priority priority,
    @NotNull RiskLevel riskLevel,
    String impact,
    String affectedCi,
    String businessJustification,
    String implementationPlan,
    String rollbackPlan,
    String testPlan,
    @FutureOrPresent LocalDateTime plannedStartDate,
    LocalDateTime plannedEndDate,
    String customValues
) {}
