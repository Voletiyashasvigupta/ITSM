package com.northstar.request.repository;
import com.northstar.request.entity.RequestHistoryEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RequestHistoryRepository extends JpaRepository<RequestHistoryEntity, UUID> {
    List<RequestHistoryEntity> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
