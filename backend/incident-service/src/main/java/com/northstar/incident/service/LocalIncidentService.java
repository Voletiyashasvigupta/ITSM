package com.northstar.incident.service;

import com.northstar.incident.dto.IncidentDetailResponse;
import com.northstar.incident.dto.IncidentInput;
import com.northstar.incident.dto.IncidentResponse;
import com.northstar.incident.dto.IncidentStatusInput;
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
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service interface defining local incident management operations.
 *
 * <p><b>Purpose:</b> Declares contract for creating, listing, viewing, updating, and commenting on incidents.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.incident.controller.IncidentsController}.
 */
public interface LocalIncidentService {

    /**
     * Creates a new incident ticket.
     *
     * <p><b>Purpose:</b> Generates incident number, calculates priority matrix, and saves record.
     *
     * <p><b>Downstream / Workflow:</b> Called on {@code POST /api/incidents}.
     *
     * @param actor The authenticated creator subject.
     * @param input Incident form inputs.
     * @return IncidentResponse DTO.
     */
    IncidentResponse create(String actor, IncidentInput input);

    /**
     * Lists incidents scoped by requester or full directory for support staff.
     *
     * <p><b>Purpose:</b> Enforces data access control between regular employees and support staff.
     *
     * <p><b>Downstream / Workflow:</b> Called on {@code GET /api/incidents}.
     *
     * @param actor The user subject.
     * @param support Whether the user holds support/manager permissions.
     * @return List of incident responses.
     */
    List<IncidentResponse> list(String actor, boolean support);

    /**
     * Retrieves full incident details and comment history.
     *
     * <p><b>Purpose:</b> Scoped detail retrieval.
     *
     * <p><b>Downstream / Workflow:</b> Called on {@code GET /api/incidents/{id}}.
     *
     * @param id Incident UUID.
     * @param actor User subject.
     * @param support Whether user holds support authority.
     * @return IncidentDetailResponse with incident and comments.
     */
    IncidentDetailResponse detail(UUID id, String actor, boolean support);

    /**
     * Synchronizes incident state and attributes with live ServiceNow outcomes.
     */
    IncidentDetailResponse sync(UUID id, String actor, boolean support);

    /**
     * Retries ServiceNow submission or synchronization following an outage or failure.
     */
    IncidentDetailResponse retry(UUID id, String actor, boolean support);

    /**
     * Updates incident state, status, or assignee.
     *
     * <p><b>Purpose:</b> Support triage and status modification.
     *
     * <p><b>Downstream / Workflow:</b> Called on {@code PATCH /api/incidents/{id}/status}.
     *
     * @param id Incident UUID.
     * @param actor User subject.
     * @param support Support role flag.
     * @param input Updated status and assignment.
     * @return Updated IncidentResponse.
     */
    IncidentResponse update(UUID id, String actor, boolean support, IncidentStatusInput input);

    /**
     * Appends a comment to an incident.
     *
     * <p><b>Purpose:</b> Adds communication thread notes to tickets.
     *
     * <p><b>Downstream / Workflow:</b> Called on {@code POST /api/incidents/{id}/comments}.
     *
     * @param id Incident UUID.
     * @param actor Author user subject.
     * @param support Support role flag.
     * @param comment Comment text.
     * @return Created IncidentCommentEntity.
     */
    IncidentCommentEntity comment(UUID id, String actor, boolean support, String comment);

    /**
     * Generates a sequential human-readable incident number (e.g. INC0010001).
     *
     * <p><b>Purpose:</b> Numbering strategy.
     *
     * <p><b>Downstream / Workflow:</b> Assigned to new incident records.
     *
     * @return Formatted incident number string.
     */
    String generateNextNumber();
}

/**
 * Default implementation of {@link LocalIncidentService}.
 *
 * <p><b>Purpose:</b> Implements ITIL priority matrices, ownership validation, and persistence for incidents.
 *
 * <p><b>Downstream / Workflow:</b> Communicates with {@link IncidentRepository} and {@link IncidentCommentRepository}.
 */
@Service
class LocalIncidentServiceImpl implements LocalIncidentService {
    private final IncidentRepository incidents;
    private final IncidentCommentRepository comments;
    private final ServiceNowIncidentClient serviceNowClient;
    private final ServiceNowIncidentMapper statusMapper;

    LocalIncidentServiceImpl(IncidentRepository incidents, IncidentCommentRepository comments,
                             ServiceNowIncidentClient serviceNowClient) {
        this(incidents, comments, serviceNowClient, new ServiceNowIncidentMapper());
    }

    @org.springframework.beans.factory.annotation.Autowired
    LocalIncidentServiceImpl(IncidentRepository incidents, IncidentCommentRepository comments,
                             ServiceNowIncidentClient serviceNowClient, ServiceNowIncidentMapper statusMapper) {
        this.incidents = incidents;
        this.comments = comments;
        this.serviceNowClient = serviceNowClient;
        this.statusMapper = statusMapper != null ? statusMapper : new ServiceNowIncidentMapper();
    }

    @Override
    public String generateNextNumber() {
        long count = incidents.count();
        return String.format("INC%07d", 10001 + count);
    }

    @Override
    @Transactional
    public IncidentResponse create(String actor, IncidentInput input) {
        String num = (input.incidentNumber() != null && !input.incidentNumber().isBlank())
                ? input.incidentNumber().trim()
                : generateNextNumber();

        String impact = (input.impact() != null && !input.impact().isBlank()) ? input.impact().trim() : "3 - Low";
        String urgency = (input.urgency() != null && !input.urgency().isBlank()) ? input.urgency().trim() : "3 - Low";
        String priority = calculatePriority(impact, urgency, input.priority());

        String caller = (input.caller() != null && !input.caller().isBlank()) ? input.caller().trim() : actor;
        String shortDesc = input.effectiveShortDescription();
        String desc = (input.description() != null) ? input.description().trim() : "";
        String correlationId = UUID.randomUUID().toString();

        // Attempt live synchronization with external ServiceNow Cloud instance
        String externalId = null;
        String externalSystem = "local";
        String syncStatus = "SYNCED";
        String syncError = null;
        boolean outage = false;

        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", shortDesc);
            snPayload.put("description", desc);
            snPayload.put("category", input.category() != null ? input.category() : "Software");
            snPayload.put("impact", statusMapper.mapSeverityToServiceNow(impact));
            snPayload.put("urgency", statusMapper.mapSeverityToServiceNow(urgency));
            snPayload.put("caller_id", caller);
            snPayload.put("correlation_id", correlationId);

            Map<String, Object> snResponse = serviceNowClient.createIncident(snPayload);
            if (snResponse != null && snResponse.get("number") != null) {
                num = String.valueOf(snResponse.get("number"));
                externalId = String.valueOf(snResponse.get("sys_id"));
                externalSystem = "servicenow";
            } else {
                throw new IllegalStateException("ServiceNow returned empty response");
            }
        } catch (Exception ex) {
            outage = true;
            syncStatus = "PENDING_RETRY";
            syncError = "ServiceNow unreachable: " + (ex.getMessage() != null ? ex.getMessage() : ex.toString());
        }

        IncidentEntity incident = new IncidentEntity(
                num,
                caller,
                input.category(),
                input.subcategory(),
                input.service(),
                input.serviceOffering(),
                input.channel(),
                input.state(),
                impact,
                urgency,
                priority,
                input.assignedTo(),
                shortDesc,
                desc,
                actor
        );
        incident.setExternalLink(externalId, externalSystem);
        incident.setCorrelationId(correlationId);
        incident.setAssignmentGroup(ServiceNowIncidentMapper.DEFAULT_ASSIGNMENT_GROUP);
        incident.setSyncStatus(syncStatus);
        incident.setSyncError(syncError);
        if (outage) {
            incident.setSyncAttempts(1);
            incident.setNextSyncAttemptAt(Instant.now().plusSeconds(10));
        }

        IncidentEntity saved = incidents.save(incident);
        if (outage) {
            comments.save(new IncidentCommentEntity(saved.getId(), "system",
                    "ServiceNow unreachable during submission (" + syncError + "). Record preserved locally and queued for background retry."));
        }

        return view(saved);
    }

    private static String mapPriorityLevelToServiceNow(String val) {
        if (val == null) return "3";
        if (val.startsWith("1")) return "1";
        if (val.startsWith("2")) return "2";
        return "3";
    }

    @Override
    public List<IncidentResponse> list(String actor, boolean support) {
        List<IncidentEntity> results = support
                ? incidents.findAllByOrderByCreatedAtDesc()
                : incidents.findByReporterIdOrderByCreatedAtDesc(actor);
        return results.stream().map(this::view).toList();
    }

    @Override
    public IncidentDetailResponse detail(UUID id, String actor, boolean support) {
        IncidentEntity incident = find(id);
        assertAccess(incident, actor, support);
        if ("servicenow".equalsIgnoreCase(incident.getExternalSystem()) && incident.getExternalId() != null && !incident.getExternalId().isBlank()) {
            try {
                return sync(id, actor, support);
            } catch (Exception ignored) {}
        }
        return new IncidentDetailResponse(view(incident), comments.findByIncidentIdOrderByCreatedAtAsc(id));
    }

    @Override
    @Transactional
    public IncidentDetailResponse sync(UUID id, String actor, boolean support) {
        IncidentEntity incident = find(id);
        assertAccess(incident, actor, support);
        if ("servicenow".equalsIgnoreCase(incident.getExternalSystem()) && incident.getExternalId() != null && !incident.getExternalId().isBlank()) {
            try {
                Map<String, Object> snData = serviceNowClient.getIncident(incident.getExternalId());
                if (snData != null) {
                    String snState = snData.get("incident_state") != null ? String.valueOf(snData.get("incident_state")).trim()
                            : (snData.get("state") != null ? String.valueOf(snData.get("state")).trim() : "");
                    String snPriority = snData.get("priority") != null ? String.valueOf(snData.get("priority")).trim() : "";

                    if (snData.get("assignment_group") != null) {
                        Object grp = snData.get("assignment_group");
                        String grpStr = grp instanceof Map<?, ?> m ? String.valueOf(m.get("display_value") != null ? m.get("display_value") : m.get("value")) : String.valueOf(grp);
                        if (!grpStr.isBlank() && !"null".equalsIgnoreCase(grpStr)) incident.setAssignmentGroup(grpStr);
                    }
                    if (snData.get("assigned_to") != null) {
                        Object usr = snData.get("assigned_to");
                        String usrStr = usr instanceof Map<?, ?> m ? String.valueOf(m.get("display_value") != null ? m.get("display_value") : m.get("value")) : String.valueOf(usr);
                        if (!usrStr.isBlank() && !"null".equalsIgnoreCase(usrStr)) incident.addAssignee(usrStr);
                    }

                    String mappedState = statusMapper.mapServiceNowStateToLocal(snState);
                    if (mappedState != null && !mappedState.equalsIgnoreCase(incident.getState())) {
                        String oldState = incident.getState();
                        incident.updateState(mappedState);
                        comments.save(new IncidentCommentEntity(id, "servicenow",
                                "Synced state from ServiceNow: " + oldState + " -> " + mappedState + " (priority: " + snPriority + ")"));
                    }
                    incidents.save(incident);
                }
            } catch (Exception ignored) {}
        }
        return new IncidentDetailResponse(view(incident), comments.findByIncidentIdOrderByCreatedAtAsc(id));
    }

    @Override
    @Transactional
    public IncidentDetailResponse retry(UUID id, String actor, boolean support) {
        IncidentEntity incident = find(id);
        assertAccess(incident, actor, support);

        if ("servicenow".equalsIgnoreCase(incident.getExternalSystem()) && incident.getExternalId() != null && !incident.getExternalId().isBlank()) {
            return sync(id, actor, support);
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

                comments.save(new IncidentCommentEntity(id, actor,
                        "Manual retry succeeded. Linked to ServiceNow incident " + num));
            } else {
                throw new IllegalStateException("ServiceNow returned empty response");
            }
        } catch (Exception ex) {
            int attempts = incident.getSyncAttempts() != null ? incident.getSyncAttempts() + 1 : 1;
            incident.setSyncAttempts(attempts);
            incident.setSyncStatus(attempts >= 5 ? "FAILED" : "PENDING_RETRY");
            incident.setSyncError(ex.getMessage() != null ? ex.getMessage() : ex.toString());
            incidents.save(incident);

            comments.save(new IncidentCommentEntity(id, actor,
                    "Manual retry failed: " + ex.getMessage()));
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ServiceNow incident retry failed: " + ex.getMessage());
        }
        return new IncidentDetailResponse(view(incident), comments.findByIncidentIdOrderByCreatedAtAsc(id));
    }

    private static String mapServiceNowStateToLocal(String snState) {
        if (snState == null || snState.isBlank()) return null;
        return switch (snState) {
            case "1" -> "New";
            case "2" -> "In Progress";
            case "3" -> "On Hold";
            case "6" -> "Resolved";
            case "7" -> "Closed";
            case "8" -> "Canceled";
            default -> null;
        };
    }

    private static String mapLocalStateToServiceNow(String localState) {
        if (localState == null) return "1";
        return switch (localState.toLowerCase()) {
            case "in progress" -> "2";
            case "on hold" -> "3";
            case "resolved" -> "6";
            case "closed" -> "7";
            case "canceled", "cancelled" -> "8";
            default -> "1";
        };
    }

    @Override
    @Transactional
    public IncidentResponse update(UUID id, String actor, boolean support, IncidentStatusInput input) {
        if (!support) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Support role required");
        }
        IncidentEntity incident = find(id);

        String newState = input.state() != null ? input.state() : input.status();
        if (newState != null && !newState.isBlank()) {
            incident.updateState(newState);
        }

        String targetAssignee = input.assignedTo() != null ? input.assignedTo() : input.assigneeId();
        if (targetAssignee != null) {
            incident.addAssignee(targetAssignee.isBlank() ? null : targetAssignee.trim());
        }

        // Propagate state update to ServiceNow Cloud instance
        if ("servicenow".equalsIgnoreCase(incident.getExternalSystem()) && incident.getExternalId() != null && !incident.getExternalId().isBlank()) {
            try {
                Map<String, Object> snUpdate = new HashMap<>();
                if (newState != null && !newState.isBlank()) {
                    String mappedSnState = mapLocalStateToServiceNow(newState);
                    snUpdate.put("incident_state", mappedSnState);
                    snUpdate.put("state", mappedSnState);
                }
                snUpdate.put("work_notes", "Status updated to " + incident.getState() + " by " + actor + " in Service Hub");
                serviceNowClient.updateIncident(incident.getExternalId(), snUpdate);
            } catch (Exception ignored) {}
        }

        return view(incident);
    }

    @Override
    @Transactional
    public IncidentCommentEntity comment(UUID id, String actor, boolean support, String comment) {
        IncidentEntity incident = find(id);
        assertAccess(incident, actor, support);
        return comments.save(new IncidentCommentEntity(id, actor, comment.trim()));
    }

    private String calculatePriority(String impact, String urgency, String fallbackPriority) {
        int imp = parseSeverity(impact);
        int urg = parseSeverity(urgency);

        if (imp == 1 && urg == 1) return "1 - Critical";
        if ((imp == 1 && urg == 2) || (imp == 2 && urg == 1)) return "2 - High";
        if ((imp == 1 && urg == 3) || (imp == 2 && urg == 2) || (imp == 3 && urg == 1)) return "3 - Moderate";
        if ((imp == 2 && urg == 3) || (imp == 3 && urg == 2)) return "4 - Low";
        if (imp == 3 && urg == 3) return "4 - Low";

        return (fallbackPriority != null && !fallbackPriority.isBlank()) ? fallbackPriority : "4 - Low";
    }

    private int parseSeverity(String value) {
        if (value == null) return 3;
        if (value.startsWith("1")) return 1;
        if (value.startsWith("2")) return 2;
        return 3;
    }

    private IncidentEntity find(UUID id) {
        return incidents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
    }

    private void assertAccess(IncidentEntity incident, String actor, boolean support) {
        boolean isOwner = actor.equals(incident.getReporterId()) || actor.equals(incident.getCaller());
        if (!support && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this incident");
        }
    }

    private IncidentResponse view(IncidentEntity incident) {
        String number = incident.getIncidentNumber();
        if (number == null || number.isBlank()) {
            String compact = incident.getId().toString().replace("-", "").substring(0, 6).toUpperCase();
            number = "INC" + compact;
        }

        return new IncidentResponse(
                incident.getId(),
                number,
                incident.getCaller(),
                incident.getCategory(),
                incident.getSubcategory(),
                incident.getService(),
                incident.getServiceOffering(),
                incident.getChannel(),
                incident.getState(),
                incident.getImpact(),
                incident.getUrgency(),
                incident.getPriority(),
                incident.getAssignedTo(),
                incident.getShortDescription(),
                incident.getDescription(),
                incident.getTitle(),
                incident.getStatus(),
                incident.getReporterId(),
                incident.getAssigneeId(),
                incident.getExternalId(),
                incident.getExternalSystem(),
                incident.getCreatedAt(),
                incident.getUpdatedAt(),
                incident.getAssignmentGroup(),
                incident.getSyncStatus() != null ? incident.getSyncStatus() : "SYNCED",
                incident.getSyncError()
        );
    }
}
