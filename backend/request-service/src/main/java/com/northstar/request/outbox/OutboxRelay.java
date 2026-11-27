package com.northstar.request.outbox;

import com.northstar.request.config.RequestMessagingConfig;
import com.northstar.request.repository.OutboxMessageRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.northstar.request.service.RequestSyncStatusService;

/**
 * Scheduled background worker implementing reliable transactional outbox message relay to RabbitMQ.
 *
 * <p><b>Purpose:</b> Polls unpublished outbox messages, claims them via distributed locking, converts them into persistent
 * AMQP messages, publishes them to the RabbitMQ exchange with publisher confirms, and applies exponential backoff
 * retries up to {@code MAX_ATTEMPTS} (4) before routing failures to the dead-letter exchange.
 *
 * <p><b>Downstream / Workflow:</b> Periodically triggered by Spring's scheduled task executor every 1000ms.
 * Notifies {@link RequestSyncStatusService} of delivery or failure.
 */
@Component
public class OutboxRelay {
    private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);
    private static final int MAX_ATTEMPTS = 4;
    private final OutboxMessageRepository outbox;
    private final RabbitTemplate rabbit;
    private final TransactionTemplate transactions;
    private final RequestSyncStatusService requestStatus;

    /**
     * Constructs the OutboxRelay worker.
     *
     * @param outbox Repository for outbox entities.
     * @param rabbit RabbitTemplate for AMQP publishing.
     * @param transactions TransactionTemplate for atomic lock claiming.
     * @param requestStatus Service tracking sync status on parent requests.
     */
    public OutboxRelay(OutboxMessageRepository outbox, RabbitTemplate rabbit, TransactionTemplate transactions, RequestSyncStatusService requestStatus) {
        this.outbox = outbox;
        this.rabbit = rabbit;
        this.transactions = transactions;
        this.requestStatus = requestStatus;
    }

    /**
     * Periodic scheduled poller that claims and publishes pending outbox messages.
     *
     * <p><b>Purpose:</b> Executes the outbox delivery pipeline with persistent AMQP delivery modes and publisher confirmations.
     *
     * <p><b>Downstream / Workflow:</b> On success marks outbox message delivered; on repeated failure routes to DLQ and updates request status.
     */
    @Scheduled(fixedDelayString = "${request.outbox.poll-ms:1000}")
    public void relay() {
        Instant now = Instant.now();
        for (OutboxMessageEntity message : outbox.findTop25ByPublishedAtIsNullAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(now)) {
            if (!claim(message.getId(), now)) continue;
            boolean deadLetter = message.getAttempts() + 1 >= MAX_ATTEMPTS;
            try {
                CorrelationData correlation = new CorrelationData(message.getId().toString());
                rabbit.convertAndSend(
                        deadLetter ? RequestMessagingConfig.DEAD_EXCHANGE : RequestMessagingConfig.EXCHANGE,
                        deadLetter ? RequestMessagingConfig.DEAD_ROUTING_KEY : RequestMessagingConfig.ROUTING_KEY,
                        message.getPayload(),
                        outgoing -> {
                            outgoing.getMessageProperties().setDeliveryMode(org.springframework.amqp.core.MessageDeliveryMode.PERSISTENT);
                            outgoing.getMessageProperties().setHeader("requestId", message.getAggregateId());
                            outgoing.getMessageProperties().setHeader("eventType", message.getEventType());
                            return outgoing;
                        }, correlation);
                CorrelationData.Confirm confirm = correlation.getFuture().get(10, TimeUnit.SECONDS);
                if (!confirm.isAck()) throw new IllegalStateException("Broker did not confirm message");
                Instant deliveredAt = Instant.now();
                transactions.executeWithoutResult(status -> outbox.markDelivered(
                        message.getId(), deliveredAt, deadLetter ? deliveredAt : null));
                if (deadLetter) requestStatus.failed(message.getAggregateId());
                else requestStatus.published(message.getAggregateId());
            } catch (Exception failure) {
                int attempts = message.getAttempts() + 1;
                log.warn("Outbox publish failed for event {} request {} (attempt {}/{}): {}", message.getEventType(), message.getAggregateId(), attempts, MAX_ATTEMPTS, failure.toString());
                if(attempts >= MAX_ATTEMPTS){
                    Instant failedAt=Instant.now();
                    transactions.executeWithoutResult(status->outbox.markFailed(message.getId(),attempts,failedAt));
                    requestStatus.failed(message.getAggregateId());
                    log.error("Outbox event {} for request {} permanently failed after {} attempts",message.getEventType(),message.getAggregateId(),attempts);
                } else {
                    long delaySeconds = Math.min(60, 1L << Math.min(attempts, 6));
                    transactions.executeWithoutResult(status -> outbox.scheduleRetry(
                            message.getId(), attempts, Instant.now().plus(Duration.ofSeconds(delaySeconds))));
                }
            }
        }
    }

    /**
     * Atomically claims an outbox message for 30 seconds using an isolated transaction.
     *
     * @param id Message UUID.
     * @param now Current timestamp.
     * @return {@code true} if claimed.
     */
    private boolean claim(java.util.UUID id, Instant now) {
        return Boolean.TRUE.equals(transactions.execute(status ->
                outbox.claim(id, now, now.plusSeconds(30)) == 1));
    }
}
