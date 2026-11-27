package com.northstar.request.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a designated approver decision record stored in {@code approvals}.
 *
 * <p><b>Purpose:</b> Tracks approval state for a request: approver subject ID, decision (PENDING, APPROVED, REJECTED),
 * review comment (required on rejection), creation timestamp, and decision timestamp.
 *
 * <p><b>Downstream / Workflow:</b> Managed by {@link com.northstar.request.repository.ApprovalRepository} and
 * updated by {@link com.northstar.request.service.LocalApprovalService}.
 */
@Entity
@Table(name = "approvals")
public class ApprovalEntity {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false, unique = true)
    private UUID requestId;

    @Column(name = "approver_id", nullable = false, length = 128)
    private String approverId;

    @Column(nullable = false, length = 16)
    private String decision;

    @Column(length = 2000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    /** Protected no-arg constructor for JPA. */
    protected ApprovalEntity() {}

    /**
     * Constructs a new pending approval entity for a request.
     *
     * @param requestId Target request UUID.
     * @param approverId Designated approver subject ID.
     */
    public ApprovalEntity(UUID requestId, String approverId) {
        this.id = UUID.randomUUID();
        this.requestId = requestId;
        this.approverId = approverId;
        this.decision = "PENDING";
        this.createdAt = Instant.now();
    }

    /**
     * Records the approver's final decision.
     *
     * @param value Decision string ("APPROVED" or "REJECTED").
     * @param comment Reason comment.
     */
    public void decide(String value, String comment) {
        this.decision = value;
        this.comment = comment;
        this.decidedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRequestId() { return requestId; }
    public String getApproverId() { return approverId; }
    public String getDecision() { return decision; }
    public String getComment() { return comment; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDecidedAt() { return decidedAt; }
}
