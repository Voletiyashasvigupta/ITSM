package com.northstar.request.repository;

import com.northstar.request.entity.ServiceRequestEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequestEntity, UUID> {
    Optional<ServiceRequestEntity> findByIdempotencyKey(String idempotencyKey);
    Page<ServiceRequestEntity> findByRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(String requesterId, String requestedForId, String approverId, Pageable pageable);
    Page<ServiceRequestEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<ServiceRequestEntity> findByServiceNameNotOrRequesterIdOrRequestedForIdOrApproverIdOrderByCreatedAtDesc(String serviceName, String requesterId, String requestedForId, String approverId, Pageable pageable);
    @Modifying @Transactional
    @Query("update ServiceRequestEntity r set r.status = :status where r.id = :id")
    int updateStatus(@Param("id") UUID id, @Param("status") com.northstar.request.entity.RequestStatus status);
}
