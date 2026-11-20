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
    @Transactional
    public IncidentResponse create(String actor, IncidentInput input) {
        IncidentEntity incident = new IncidentEntity(input.title().trim(), input.description().trim(),
                input.category().trim(), input.priority(), actor);
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
        if (input.status() != null) {
            incident.updateStatus(input.status());
        }
        if (input.assigneeId() != null) {
            String assignee = input.assigneeId().isBlank() ? null : input.assigneeId().trim();
            incident.addAssignee(assignee);
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

    private IncidentEntity find(UUID id) {
        return incidents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
    }

    private void assertAccess(IncidentEntity incident, String actor, boolean support) {
        if (!support && !incident.getReporterId().equals(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this incident");
        }
    }

    private IncidentResponse view(IncidentEntity incident) {
        return new IncidentResponse(incident.getId(), incident.getTitle(), incident.getDescription(),
                incident.getCategory(), incident.getPriority(), incident.getStatus(), incident.getReporterId(),
                incident.getAssigneeId(), incident.getCreatedAt(), incident.getUpdatedAt());
    }
}
