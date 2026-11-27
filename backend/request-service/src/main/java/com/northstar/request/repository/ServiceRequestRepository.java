package com.northstar.request.repository;

import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.entity.RequestStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

/**
 * Spring Data JPA repository for {@link ServiceRequestEntity}.
 *
 * <p><b>Purpose:</b> Manages service request database operations: idempotency lookups, requester/beneficiary/approver
 * participant scoping, department exclusion filters (People Support scoping), and direct status updates.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.request.service.LocalRequestService} and {@link com.northstar.request.service.RequestSubmissionWriter}.
 */
public interface ServiceRequestRepository extends JpaRepository<ServiceRequestEntity, UUID> {

    /**
     * Looks up an existing request by its unique idempotency key.
     *
     * @param idempotencyKey Key from HTTP header.
     * @return Optional containing existing request.
     */
    Optional<ServiceRequestEntity> findByIdempotencyKey(String idempotencyKey);

    /**
     * Finds requests where the user is requester, requested-for, or approver.
     *
     * @param requesterId Requester ID.
     * @param requestedForId Beneficiary ID.
     * @param approverId Approver ID.
     * @param pageable Pagination.
     * @return Page of requests.
     */
    Page<ServiceRequestEntity> findByRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(String requesterId, String requestedForId, String approverId, Pageable pageable);

    /**
     * Finds all requests ordered newest first.
     *
     * @param pageable Pagination.
     * @return Page of all requests.
     */
    Page<ServiceRequestEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Finds all requests excluding sensitive service names (like People Support) unless the user is a participant.
     *
     * @param serviceName Service to exclude from public queue.
     * @param requesterId Requester ID.
     * @param requestedForId Beneficiary ID.
     * @param approverId Approver ID.
     * @param pageable Pagination.
     * @return Page of filtered requests.
     */
    Page<ServiceRequestEntity> findByServiceNameNotOrRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(String serviceName, String requesterId, String requestedForId, String approverId, Pageable pageable);

    /**
     * Direct query updating the status of a service request.
     *
     * @param id Request UUID.
     * @param status New RequestStatus.
     * @return Number of rows updated.
     */
    @Modifying
    @Transactional
    @Query("update ServiceRequestEntity r set r.status = :status where r.id = :id")
    int updateStatus(@Param("id") UUID id, @Param("status") RequestStatus status);
}
