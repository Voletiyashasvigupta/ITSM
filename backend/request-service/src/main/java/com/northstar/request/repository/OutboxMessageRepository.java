package com.northstar.request.repository;

import com.northstar.request.outbox.OutboxMessageEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for {@link OutboxMessageEntity} with atomic optimistic locking queries.
 *
 * <p><b>Purpose:</b> Manages polling, atomic distributed claiming, delivery acknowledgment, retry scheduling,
 * and failure marking for transactional outbox messages.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.request.outbox.OutboxRelay}.
 */
public interface OutboxMessageRepository extends JpaRepository<OutboxMessageEntity, UUID> {

    /**
     * Polls up to 25 unpublished messages whose next attempt timestamp is due.
     *
     * @param now Current timestamp.
     * @return Batch of pending outbox messages.
     */
    List<OutboxMessageEntity> findTop25ByPublishedAtIsNullAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(Instant now);

    /**
     * Atomically claims an outbox message for processing by locking it until lockUntil.
     *
     * @param id Message UUID.
     * @param now Current timestamp.
     * @param lockUntil Expiration of claim lock.
     * @return 1 if claimed successfully; 0 if already locked.
     */
    @Modifying
    @Query("update OutboxMessageEntity m set m.lockedUntil = :lockUntil where m.id = :id and m.publishedAt is null and (m.lockedUntil is null or m.lockedUntil < :now)")
    int claim(@Param("id") UUID id, @Param("now") Instant now, @Param("lockUntil") Instant lockUntil);

    /**
     * Marks an outbox message as successfully delivered to the broker.
     *
     * @param id Message UUID.
     * @param publishedAt Delivery timestamp.
     * @param deadLetteredAt Optional dead letter timestamp.
     * @return Number of rows updated.
     */
    @Modifying
    @Query("update OutboxMessageEntity m set m.publishedAt = :publishedAt, m.deadLetteredAt = :deadLetteredAt, m.lockedUntil = null where m.id = :id")
    int markDelivered(@Param("id") UUID id, @Param("publishedAt") Instant publishedAt, @Param("deadLetteredAt") Instant deadLetteredAt);

    /**
     * Reschedules an outbox message for a subsequent retry attempt with backoff.
     *
     * @param id Message UUID.
     * @param attempts Incremented attempt count.
     * @param nextAttemptAt Future timestamp when retry should occur.
     * @return Number of rows updated.
     */
    @Modifying
    @Query("update OutboxMessageEntity m set m.attempts = :attempts, m.nextAttemptAt = :nextAttemptAt, m.lockedUntil = null where m.id = :id")
    int scheduleRetry(@Param("id") UUID id, @Param("attempts") int attempts, @Param("nextAttemptAt") Instant nextAttemptAt);

    /**
     * Marks an outbox message as exhausted/failed after maximum retries.
     *
     * @param id Message UUID.
     * @param attempts Final attempt count.
     * @param failedAt Failure timestamp.
     * @return Number of rows updated.
     */
    @Modifying
    @Query("update OutboxMessageEntity m set m.attempts = :attempts, m.publishedAt = :failedAt, m.deadLetteredAt = :failedAt, m.lockedUntil = null where m.id = :id")
    int markFailed(@Param("id") UUID id, @Param("attempts") int attempts, @Param("failedAt") Instant failedAt);
}
