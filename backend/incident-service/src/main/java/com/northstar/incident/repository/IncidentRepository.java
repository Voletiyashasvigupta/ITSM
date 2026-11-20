package com.northstar.incident.repository;
import com.northstar.incident.entity.IncidentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface IncidentRepository extends JpaRepository<IncidentEntity, UUID> {
    List<IncidentEntity> findByReporterIdOrderByCreatedAtDesc(String reporterId);
    List<IncidentEntity> findAllByOrderByCreatedAtDesc();
}
