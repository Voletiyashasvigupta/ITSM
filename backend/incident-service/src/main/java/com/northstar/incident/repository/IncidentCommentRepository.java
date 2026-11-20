package com.northstar.incident.repository;
import com.northstar.incident.entity.IncidentCommentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface IncidentCommentRepository extends JpaRepository<IncidentCommentEntity, UUID> {
    List<IncidentCommentEntity> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);
}
