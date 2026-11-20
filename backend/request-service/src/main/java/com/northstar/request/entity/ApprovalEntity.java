package com.northstar.request.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approvals")
public class ApprovalEntity {
    @Id private UUID id;
    @Column(name = "request_id", nullable = false, unique = true) private UUID requestId;
    @Column(name = "approver_id", nullable = false, length = 128) private String approverId;
    @Column(nullable = false, length = 16) private String decision;
    @Column(length = 2000) private String comment;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "decided_at") private Instant decidedAt;
    protected ApprovalEntity() {}
    public ApprovalEntity(UUID requestId, String approverId) {
        this.id = UUID.randomUUID(); this.requestId = requestId; this.approverId = approverId;
        this.decision = "PENDING"; this.createdAt = Instant.now();
    }
    public void decide(String value, String comment) { this.decision = value; this.comment = comment; this.decidedAt = Instant.now(); }
    public UUID getId() { return id; } public UUID getRequestId() { return requestId; } public String getApproverId() { return approverId; }
    public String getDecision() { return decision; } public String getComment() { return comment; } public Instant getCreatedAt() { return createdAt; }
    public Instant getDecidedAt() { return decidedAt; }
}
