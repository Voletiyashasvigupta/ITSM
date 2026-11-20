package com.northstar.incident.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_comments")
public class IncidentCommentEntity {
    @Id private UUID id;
    @Column(name = "incident_id", nullable = false) private UUID incidentId;
    @Column(name = "author_id", nullable = false, length = 128) private String authorId;
    @Column(nullable = false, columnDefinition = "TEXT") private String comment;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected IncidentCommentEntity() {}
    public IncidentCommentEntity(UUID incidentId, String authorId, String comment) {
        this.id = UUID.randomUUID(); this.incidentId = incidentId; this.authorId = authorId; this.comment = comment; this.createdAt = Instant.now();
    }
    public UUID getId() { return id; } public UUID getIncidentId() { return incidentId; } public String getAuthorId() { return authorId; }
    public String getComment() { return comment; } public Instant getCreatedAt() { return createdAt; }
}
