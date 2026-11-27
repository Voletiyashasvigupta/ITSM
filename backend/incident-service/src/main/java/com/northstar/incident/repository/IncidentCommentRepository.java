package com.northstar.incident.repository;
import com.northstar.incident.entity.IncidentCommentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
/**
 * Spring Data JPA repository for {@link IncidentCommentEntity}.
 *
 * <p><b>Purpose:</b> Manages queries for incident timeline comments.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.incident.service.LocalIncidentService}.
 */
public interface IncidentCommentRepository extends JpaRepository<IncidentCommentEntity, UUID> {

    /**
     * Finds all comments for an incident ordered by creation time ascending.
     *
     * <p><b>Purpose:</b> Constructs the chronological conversation timeline for a ticket.
     *
     * <p><b>Downstream / Workflow:</b> Merged into {@link com.northstar.incident.dto.IncidentDetailResponse} for display in the portal.
     *
     * @param incidentId Target incident UUID.
     * @return Ordered list of comments.
     */
    List<IncidentCommentEntity> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);
}
