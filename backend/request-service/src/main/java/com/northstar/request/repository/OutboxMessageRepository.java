package com.northstar.request.repository;

import com.northstar.request.outbox.OutboxMessageEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OutboxMessageRepository extends JpaRepository<OutboxMessageEntity, UUID> {
    List<OutboxMessageEntity> findTop25ByPublishedAtIsNullAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(Instant now);

    @Modifying
    @Query("update OutboxMessageEntity m set m.lockedUntil = :lockUntil where m.id = :id and m.publishedAt is null and (m.lockedUntil is null or m.lockedUntil < :now)")
    int claim(@Param("id") UUID id, @Param("now") Instant now, @Param("lockUntil") Instant lockUntil);

    @Modifying
    @Query("update OutboxMessageEntity m set m.publishedAt = :publishedAt, m.deadLetteredAt = :deadLetteredAt, m.lockedUntil = null where m.id = :id")
    int markDelivered(@Param("id") UUID id, @Param("publishedAt") Instant publishedAt, @Param("deadLetteredAt") Instant deadLetteredAt);

    @Modifying
    @Query("update OutboxMessageEntity m set m.attempts = :attempts, m.nextAttemptAt = :nextAttemptAt, m.lockedUntil = null where m.id = :id")
    int scheduleRetry(@Param("id") UUID id, @Param("attempts") int attempts, @Param("nextAttemptAt") Instant nextAttemptAt);

    @Modifying
    @Query("update OutboxMessageEntity m set m.attempts = :attempts, m.publishedAt = :failedAt, m.deadLetteredAt = :failedAt, m.lockedUntil = null where m.id = :id")
    int markFailed(@Param("id") UUID id,@Param("attempts") int attempts,@Param("failedAt") Instant failedAt);
}
