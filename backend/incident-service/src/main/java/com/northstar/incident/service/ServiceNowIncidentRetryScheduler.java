package com.northstar.incident.service;

import com.northstar.incident.entity.IncidentCommentEntity;
import com.northstar.incident.entity.IncidentEntity;
import com.northstar.incident.integration.ServiceNowIncidentClient;
import com.northstar.incident.integration.ServiceNowIncidentMapper;
import com.northstar.incident.repository.IncidentCommentRepository;
import com.northstar.incident.repository.IncidentRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Background worker handling incident synchronization retries during ServiceNow outages.
 *
 * <p><b>Features:</b>
 * <ul>
 *   <li>Picks up tickets saved with {@code "syncStatus":"PENDING_RETRY"}.</li>
 *   <li>Enforces exponential backoff ((1 &lt;&lt; attempts) * 5s).</li>
 *   <li>Enforces max retries limit (5). Upon exceeding, marks {@code FAILED} with visible reason.</li>
 *   <li>Retains idempotency using stored {@code correlationId}.</li>
 *   <li>Logs audit comments on each retry lifecycle event.</li>
 * </ul>
 */
@Component
public class ServiceNowIncidentRetryScheduler {
    private static final Logger log = LoggerFactory.getLogger(ServiceNowIncidentRetryScheduler.class);
    private static final int MAX_RETRIES = 5;

    private final IncidentRepository incidents;
    private final IncidentCommentRepository comments;
    private final ServiceNowIncidentClient serviceNowClient;
    private final ServiceNowIncidentMapper statusMapper;

    public ServiceNowIncidentRetryScheduler(IncidentRepository incidents,
                                            IncidentCommentRepository comments,
                                            ServiceNowIncidentClient serviceNowClient,
                                            ServiceNowIncidentMapper statusMapper) {
        this.incidents = incidents;
        this.comments = comments;
        this.serviceNowClient = serviceNowClient;
        this.statusMapper = statusMapper;
    }

    @Scheduled(fixedDelay = 10000, initialDelay = 10000)
    public void processPendingRetries() {
        List<IncidentEntity> pending = incidents.findBySyncStatus("PENDING_RETRY");
        if (pending.isEmpty()) return;

        Instant now = Instant.now();
        for (IncidentEntity incident : pending) {
            try {
                processSingleIncident(incident, now);
            } catch (Exception ex) {
                log.warn("Background retry error for incident {}: {}", incident.getIncidentNumber(), ex.getMessage());
            }
        }
    }

    @Transactional
    public void processSingleIncident(IncidentEntity incident, Instant now) {
        int attempts = incident.getSyncAttempts() != null ? incident.getSyncAttempts() : 1;

        if (attempts >= MAX_RETRIES) {
            incident.setSyncStatus("FAILED");
            incident.setSyncError("Exceeded max retry limit (" + MAX_RETRIES + ") during ServiceNow outage. Manual retry required.");
            incidents.save(incident);
            comments.save(new IncidentCommentEntity(incident.getId(), "system",
                    "ServiceNow sync reached max retry limit (" + MAX_RETRIES + "). Ticket marked as FAILED for manual intervention."));
            return;
        }

        if (incident.getNextSyncAttemptAt() != null && now.isBefore(incident.getNextSyncAttemptAt())) {
            return; // Wait until backoff expires
        }

        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", incident.getShortDescription());
            snPayload.put("description", incident.getDescription());
            snPayload.put("category", incident.getCategory() != null ? incident.getCategory() : "Software");
            snPayload.put("impact", statusMapper.mapSeverityToServiceNow(incident.getImpact()));
            snPayload.put("urgency", statusMapper.mapSeverityToServiceNow(incident.getUrgency()));
            snPayload.put("caller_id", incident.getCaller());
            if (incident.getCorrelationId() != null) {
                snPayload.put("correlation_id", incident.getCorrelationId());
            }
            if (incident.getAssignmentGroup() != null && !incident.getAssignmentGroup().isBlank()) {
                snPayload.put("assignment_group", incident.getAssignmentGroup());
            }

            Map<String, Object> snResponse = serviceNowClient.createIncident(snPayload);
            if (snResponse != null && snResponse.get("number") != null) {
                String num = String.valueOf(snResponse.get("number"));
                String externalId = String.valueOf(snResponse.get("sys_id"));
                incident.setIncidentNumber(num);
                incident.setExternalLink(externalId, "servicenow");
                incident.setSyncStatus("SYNCED");
                incident.setSyncError(null);
                incident.setNextSyncAttemptAt(null);
                incidents.save(incident);

                comments.save(new IncidentCommentEntity(incident.getId(), "system",
                        "Successfully linked to ServiceNow incident " + num + " following background recovery."));
                log.info("Successfully recovered incident {} after outage. ServiceNow Number: {}", incident.getIncidentNumber(), num);
            } else {
                throw new IllegalStateException("ServiceNow returned empty response");
            }
        } catch (Exception ex) {
            attempts++;
            long backoffSec = (1L << attempts) * 5L;
            incident.setSyncAttempts(attempts);
            if (attempts >= MAX_RETRIES) {
                incident.setSyncStatus("FAILED");
                incident.setSyncError("Exceeded max retry limit (" + MAX_RETRIES + "). Last error: " + ex.getMessage());
                comments.save(new IncidentCommentEntity(incident.getId(), "system",
                        "Retry attempt " + attempts + " failed. Reached limit: " + ex.getMessage()));
            } else {
                incident.setSyncStatus("PENDING_RETRY");
                incident.setSyncError("Outage retry " + attempts + " failed: " + ex.getMessage());
                incident.setNextSyncAttemptAt(Instant.now().plusSeconds(backoffSec));
                comments.save(new IncidentCommentEntity(incident.getId(), "system",
                        "Outage retry " + attempts + " failed: " + ex.getMessage() + ". Next retry in " + backoffSec + "s."));
            }
            incidents.save(incident);
        }
    }
}
