package com.northstar.request.repository;
import com.northstar.request.entity.ApprovalEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ApprovalRepository extends JpaRepository<ApprovalEntity, UUID> {
    List<ApprovalEntity> findByApproverIdAndDecisionOrderByCreatedAtDesc(String approverId, String decision);
    List<ApprovalEntity> findByApproverIdOrderByCreatedAtDesc(String approverId);
    Optional<ApprovalEntity> findByRequestId(UUID requestId);
}
