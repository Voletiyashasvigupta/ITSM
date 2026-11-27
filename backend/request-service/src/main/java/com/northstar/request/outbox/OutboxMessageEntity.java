package com.northstar.request.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity implementing the Transactional Outbox pattern in {@code outbox_messages}.
 *
 * <p><b>Purpose:</b> Stores outbound domain events in the same database transaction as the service request.
 * Contains aggregate ID, event type, JSON payload, attempt counts, retry scheduling timestamps,
 * distributed locking timestamps, and publishing/dead-letter markers.
 *
 * <p><b>Downstream / Workflow:</b> Saved by {@link com.northstar.request.service.RequestSubmissionWriter}.
 * Polled and relayed to RabbitMQ by {@link OutboxRelay}.
 */
@Entity
@Table(name = "outbox_messages")
public class OutboxMessageEntity {
    @Id
    private UUID id;

    @Column(name = "aggregate_id", nullable = false, length = 36)
    private String aggregateId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "LONGTEXT")
    private String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "dead_lettered_at")
    private Instant deadLetteredAt;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    protected OutboxMessageEntity() {}

    public OutboxMessageEntity(UUID aggregateId, String eventType, String payload) {
        this.id = UUID.randomUUID();
        this.aggregateId = aggregateId.toString();
        this.eventType = eventType;
        this.payload = payload;
        this.attempts = 0;
    }

    @PrePersist
    void beforeInsert() {
        this.createdAt = Instant.now();
        this.nextAttemptAt = this.createdAt;
    }

    public UUID getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public void setNextAttemptAt(Instant nextAttemptAt) { this.nextAttemptAt = nextAttemptAt; }
}
