package com.northstar.request.repository;

import com.northstar.request.entity.ApprovalEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link ApprovalEntity}.
 *
 * <p><b>Purpose:</b> Manages queries for pending and historical approval decisions scoped by approver.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.request.service.LocalApprovalService}.
 */
public interface ApprovalRepository extends JpaRepository<ApprovalEntity, UUID> {

    /**
     * Finds approvals for a designated approver filtered by decision (e.g. "PENDING").
     *
     * @param approverId Approver user subject ID.
     * @param decision Decision status string.
     * @return List of matching approvals.
     */
    List<ApprovalEntity> findByApproverIdAndDecisionOrderByCreatedAtDesc(String approverId, String decision);

    /**
     * Finds all approvals assigned to an approver ordered newest first.
     *
     * @param approverId Approver user subject ID.
     * @return List of all approvals for this approver.
     */
    List<ApprovalEntity> findByApproverIdOrderByCreatedAtDesc(String approverId);

    /**
     * Looks up the approval record linked to a specific request ID.
     *
     * @param requestId Request UUID.
     * @return Optional containing the approval record.
     */
    Optional<ApprovalEntity> findByRequestId(UUID requestId);
}
