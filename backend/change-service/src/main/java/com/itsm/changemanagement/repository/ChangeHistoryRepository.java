package com.itsm.changemanagement.repository;

import com.itsm.changemanagement.entity.ChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Spring Data JPA repository for {@link ChangeHistory} audit trail entities.
 *
 * <p><b>Purpose:</b> Retrieves chronological audit histories for change requests.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.itsm.changemanagement.service.ChangeService}.
 */
public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {

    /**
     * Retrieves all history events for a change request ordered by timestamp ascending.
     *
     * @param id Change request ID.
     * @return Chronological list of history records.
     */
    List<ChangeHistory> findByChangeIdOrderByTimestampAsc(Long id);
}
