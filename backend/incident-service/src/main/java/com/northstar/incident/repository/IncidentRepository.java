package com.northstar.incident.repository;
import com.northstar.incident.entity.IncidentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
/**
 * Spring Data JPA repository for {@link IncidentEntity}.
 *
 * <p><b>Purpose:</b> Provides query methods to fetch incidents by reporter or list all records ordered by creation date.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.incident.service.LocalIncidentService}.
 */
public interface IncidentRepository extends JpaRepository<IncidentEntity, UUID> {

    /**
     * Finds all incidents created by a specific reporter ordered newest first.
     *
     * <p><b>Purpose:</b> Scopes incident listings to the requesting employee.
     *
     * <p><b>Downstream / Workflow:</b> Used when employees view their own submitted tickets.
     *
     * @param reporterId Employee user identifier.
     * @return List of matching incidents.
     */
    List<IncidentEntity> findByReporterIdOrderByCreatedAtDesc(String reporterId);

    /**
     * Finds all incidents ordered newest first.
     *
     * <p><b>Purpose:</b> Populates the support agent and manager incident queue.
     *
     * <p><b>Downstream / Workflow:</b> Used by managers and IT support staff to view all open and historical incidents.
     *
     * @return List of all incidents.
     */
    List<IncidentEntity> findAllByOrderByCreatedAtDesc();

    /**
     * Finds all incidents by synchronization status (e.g. PENDING_RETRY).
     */
    List<IncidentEntity> findBySyncStatus(String syncStatus);
}
