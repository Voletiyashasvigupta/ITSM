package com.northstar.request.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "request_history")
public class RequestHistoryEntity {
    @Id private UUID id;
    @Column(name = "request_id", nullable = false) private UUID requestId;
    @Column(name = "actor_id", nullable = false, length = 128) private String actorId;
    @Column(nullable = false, length = 64) private String action;
    @Column(name = "from_status", length = 32) private String fromStatus;
    @Column(name = "to_status", length = 32) private String toStatus;
    @Column(length = 2000) private String comment;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected RequestHistoryEntity() {}
    public RequestHistoryEntity(UUID requestId, String actorId, String action, String fromStatus, String toStatus, String comment) {
        this.id = UUID.randomUUID(); this.requestId = requestId; this.actorId = actorId; this.action = action;
        this.fromStatus = fromStatus; this.toStatus = toStatus; this.comment = comment; this.createdAt = Instant.now();
    }
    public UUID getId() { return id; } public UUID getRequestId() { return requestId; } public String getActorId() { return actorId; }
    public String getAction() { return action; } public String getFromStatus() { return fromStatus; } public String getToStatus() { return toStatus; }
    public String getComment() { return comment; } public Instant getCreatedAt() { return createdAt; }
}
