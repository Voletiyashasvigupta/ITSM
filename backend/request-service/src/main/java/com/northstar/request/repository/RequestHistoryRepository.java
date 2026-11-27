package com.northstar.request.repository;

import com.northstar.request.entity.RequestHistoryEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link RequestHistoryEntity}.
 *
 * <p><b>Purpose:</b> Retrieves chronological audit history rows for a given request.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.request.service.LocalRequestService}.
 */
public interface RequestHistoryRepository extends JpaRepository<RequestHistoryEntity, UUID> {

    /**
     * Finds all history events for a request ordered by creation time ascending.
     *
     * @param requestId Request UUID.
     * @return Ordered list of audit history entries.
     */
    List<RequestHistoryEntity> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
