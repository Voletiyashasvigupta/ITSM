package com.northstar.incident.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a comment or work note attached to an incident in {@code incident_comments}.
 *
 * <p><b>Purpose:</b> Records communication between the reporter and support staff, including author ID,
 * text body, and creation timestamp.
 *
 * <p><b>Downstream / Workflow:</b> Managed by {@link com.northstar.incident.repository.IncidentCommentRepository}
 * and displayed in chronological order on the incident detail view.
 */
@Entity
@Table(name = "incident_comments")
public class IncidentCommentEntity {
    @Id private UUID id;
    @Column(name = "incident_id", nullable = false) private UUID incidentId;
    @Column(name = "author_id", nullable = false, length = 128) private String authorId;
    @Column(nullable = false, columnDefinition = "TEXT") private String comment;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    /** Protected no-arg constructor for JPA. */
    protected IncidentCommentEntity() {}

    /**
     * Constructs a new incident comment entity.
     *
     * <p><b>Purpose:</b> Creates a timestamped comment record associated with a parent incident.
     *
     * <p><b>Downstream / Workflow:</b> Saved to MySQL when a comment is added via {@code POST /api/incidents/{id}/comments}.
     *
     * @param incidentId Foreign key ID of the parent incident.
     * @param authorId Identifier of the comment author.
     * @param comment The message text.
     */
    public IncidentCommentEntity(UUID incidentId, String authorId, String comment) {
        this.id = UUID.randomUUID(); this.incidentId = incidentId; this.authorId = authorId; this.comment = comment; this.createdAt = Instant.now();
    }

    /** @return Comment UUID. */
    public UUID getId() { return id; }
    /** @return Parent incident UUID. */
    public UUID getIncidentId() { return incidentId; }
    /** @return Author subject identifier. */
    public String getAuthorId() { return authorId; }
    /** @return Text content of the comment. */
    public String getComment() { return comment; }
    /** @return Timestamp when the comment was logged. */
    public Instant getCreatedAt() { return createdAt; }
}
