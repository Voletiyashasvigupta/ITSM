package com.northstar.request.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Data transfer record summarizing an approval record.
 *
 * <p><b>Purpose:</b> Communicates approval state, parent request number, service name, requester, approver,
 * decision status (PENDING, APPROVED, REJECTED), decision comments, and timestamps.
 *
 * <p><b>Downstream / Workflow:</b> Returned by {@link com.northstar.request.controller.ApprovalsController#inbox}
 * and rendered in the Approvals inbox tab.
 */
public record ApprovalResponse(
    UUID id,
    UUID requestId,
    String requestNumber,
    String serviceName,
    String requesterId,
    String approverId,
    String decision,
    String comment,
    Instant createdAt,
    Instant decidedAt
) {}
