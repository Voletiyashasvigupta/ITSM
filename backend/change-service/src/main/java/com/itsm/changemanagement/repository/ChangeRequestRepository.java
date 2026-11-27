package com.itsm.changemanagement.repository;

import com.itsm.changemanagement.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.*;

/**
 * Spring Data JPA repository and Specification executor for {@link ChangeRequest} entities.
 *
 * <p><b>Purpose:</b> Provides persistence, filtering, counting, and lookup by change number, requester, status, and type.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.itsm.changemanagement.service.ChangeService}.
 */
public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long>, JpaSpecificationExecutor<ChangeRequest> {

    /**
     * Looks up a change request by its unique human-readable change number.
     *
     * @param n Change number (e.g. CHG-0001001).
     * @return Optional containing matching ChangeRequest.
     */
    Optional<ChangeRequest> findByChangeNumber(String n);

    /**
     * Finds change requests submitted by a specific requester email.
     *
     * @param e Requester email.
     * @return List of matching change requests.
     */
    List<ChangeRequest> findByRequesterEmailIgnoreCase(String e);

    /**
     * Finds change requests currently in a given lifecycle status.
     *
     * @param s ChangeStatus enum.
     * @return Matching change requests.
     */
    List<ChangeRequest> findByStatus(ChangeStatus s);

    /**
     * Finds change requests of a specific type (STANDARD, NORMAL, EMERGENCY).
     *
     * @param t ChangeType enum.
     * @return Matching change requests.
     */
    List<ChangeRequest> findByChangeType(ChangeType t);

    /** Counts change requests by status. */
    long countByStatus(ChangeStatus s);

    /** Counts change requests by type. */
    long countByChangeType(ChangeType t);

    /** Counts change requests by risk level. */
    long countByRiskLevel(RiskLevel r);
}
