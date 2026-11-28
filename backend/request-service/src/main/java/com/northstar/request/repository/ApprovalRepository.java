package com.northstar.request.repository;

import com.northstar.request.entity.ApprovalEntity;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link ApprovalEntity}.
 *
 * <p><b>Purpose:</b> Manages queries for pending and historical approval decisions scoped by approver
 * and reporting hierarchy.
 */
public interface ApprovalRepository extends JpaRepository<ApprovalEntity, UUID> {

    /**
     * Finds approvals for a designated approver filtered by decision (e.g. "PENDING").
     */
    List<ApprovalEntity> findByApproverIdAndDecisionOrderByCreatedAtDesc(String approverId, String decision);

    /**
     * Finds all approvals assigned to an approver ordered newest first.
     */
    List<ApprovalEntity> findByApproverIdOrderByCreatedAtDesc(String approverId);

    /**
     * Finds all approvals with a specific decision status across all approvers (for administrators).
     */
    List<ApprovalEntity> findByDecisionOrderByCreatedAtDesc(String decision);

    /**
     * Looks up the approval record linked to a specific request ID.
     */
    Optional<ApprovalEntity> findByRequestId(UUID requestId);

    /**
     * Finds approvals linked to any of the specified request IDs.
     */
    List<ApprovalEntity> findByRequestIdIn(Collection<UUID> requestIds);
}
