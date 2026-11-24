package com.northstar.incident.service;

import com.northstar.incident.dto.IncidentDetailResponse;
import com.northstar.incident.dto.IncidentInput;
import com.northstar.incident.dto.IncidentResponse;
import com.northstar.incident.dto.IncidentStatusInput;
import com.northstar.incident.entity.IncidentCommentEntity;
import com.northstar.incident.entity.IncidentEntity;
import com.northstar.incident.repository.IncidentCommentRepository;
import com.northstar.incident.repository.IncidentRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

public interface LocalIncidentService {
    IncidentResponse create(String actor, IncidentInput input);
    List<IncidentResponse> list(String actor, boolean support);
    IncidentDetailResponse detail(UUID id, String actor, boolean support);
    IncidentResponse update(UUID id, String actor, boolean support, IncidentStatusInput input);
    IncidentCommentEntity comment(UUID id, String actor, boolean support, String comment);
    String generateNextNumber();
}

@Service
class LocalIncidentServiceImpl implements LocalIncidentService {
    private final IncidentRepository incidents;
    private final IncidentCommentRepository comments;

    LocalIncidentServiceImpl(IncidentRepository incidents, IncidentCommentRepository comments) {
        this.incidents = incidents;
        this.comments = comments;
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

        return view(incidents.save(incident));
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
        return new IncidentDetailResponse(view(incident), comments.findByIncidentIdOrderByCreatedAtAsc(id));
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
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}
