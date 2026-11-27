package com.northstar.request.service;

import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing synchronization status updates on service requests resulting from outbox delivery events.
 *
 * <p><b>Purpose:</b> Reflects messaging delivery or failure state onto the parent {@link com.northstar.request.entity.ServiceRequestEntity}.
 * Sets {@code SYNC_FAILED} status when broker retries are exhausted, and creates audit history entries.
 *
 * <p><b>Downstream / Workflow:</b> Called by {@link com.northstar.request.outbox.OutboxRelay} upon message publication or final failure.
 */
@Service
public class RequestSyncStatusService {
    private final ServiceRequestRepository requests;
    private final RequestHistoryRepository history;

    /**
     * Constructs RequestSyncStatusService.
     *
     * @param requests Repository for service requests.
     * @param history Repository for audit history logs.
     */
    public RequestSyncStatusService(ServiceRequestRepository requests, RequestHistoryRepository history) {
        this.requests = requests;
        this.history = history;
    }

    /**
     * Updates request status upon successful message delivery to broker.
     *
     * @param requestId Request UUID string.
     */
    @Transactional
    public void published(String requestId) {
        change(requestId, null);
    }

    /**
     * Flags request status as {@code SYNC_FAILED} after broker publishing fails.
     *
     * @param requestId Request UUID string.
     */
    @Transactional
    public void failed(String requestId) {
        change(requestId, RequestStatus.SYNC_FAILED);
    }

    private void change(String requestId, RequestStatus forced) {
        try {
            UUID id = UUID.fromString(requestId);
            var request = requests.findById(id).orElse(null);
            if (request == null) return;
            RequestStatus previous = request.getStatus();
            RequestStatus next = forced != null ? forced : (request.getApproverId() == null ? RequestStatus.SUBMITTED : RequestStatus.PENDING_APPROVAL);
            if (previous == RequestStatus.REJECTED || previous == RequestStatus.APPROVED || previous == RequestStatus.IN_PROGRESS || previous == RequestStatus.COMPLETED) return;
            if (previous != next) {
                request.setStatus(next);
                history.save(new RequestHistoryEntity(id, "system", "SYNC_STATUS", previous.name(), next.name(), null));
            }
        } catch (IllegalArgumentException ignored) {}
    }
}
