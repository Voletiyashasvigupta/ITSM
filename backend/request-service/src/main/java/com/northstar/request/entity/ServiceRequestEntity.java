package com.northstar.request.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * JPA entity representing a submitted service catalog request stored in {@code service_requests}.
 *
 * <p><b>Purpose:</b> Core record for employee catalog requests. Persists unique idempotency keys,
 * service catalog names, descriptions, requester and beneficiary IDs, assigned approvers, serialized dynamic form fields (JSON),
 * external sync keys, and status progression.
 *
 * <p><b>Downstream / Workflow:</b> Managed by {@link com.northstar.request.repository.ServiceRequestRepository}
 * and updated by {@link com.northstar.request.service.RequestSubmissionWriter} and {@link com.northstar.request.service.LocalRequestService}.
 */
@Entity
@Table(name = "service_requests")
public class ServiceRequestEntity {
    private static final DateTimeFormatter REQUEST_DATE = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);
    @Id
    private UUID id;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 128)
    private String idempotencyKey;

    @Column(name = "service_name", nullable = false, length = 200)
    private String serviceName;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "requester_id", nullable = false, length = 128)
    private String requesterId;

    @Column(name = "requested_for_id", nullable = false, length = 128)
    private String requestedForId;

    @Column(name = "approver_id", length = 128)
    private String approverId;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "fields_json", columnDefinition = "LONGTEXT")
    private String fieldsJson;

    @Column(name = "external_id", length = 128)
    private String externalId;

    @Column(name = "external_system", length = 64)
    private String externalSystem;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RequestStatus status;

    @Column(name = "service_now_number", length = 64)
    private String serviceNowNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Protected no-arg constructor for JPA. */
    protected ServiceRequestEntity() {}

    /**
     * Constructs a new ServiceRequestEntity with initial status based on approver presence.
     *
     * @param idempotencyKey Client idempotency key.
     * @param serviceName Catalog service name.
     * @param description Request description.
     * @param requesterId Requester employee ID.
     * @param requestedForId Beneficiary employee ID.
     * @param approverId Optional approver employee ID.
     * @param fieldsJson Serialized form inputs.
     */
    public ServiceRequestEntity(String idempotencyKey, String serviceName, String description,
                                String requesterId, String requestedForId, String approverId, String fieldsJson) {
        this.id = UUID.randomUUID();
        this.idempotencyKey = idempotencyKey;
        this.serviceName = serviceName;
        this.description = description;
        this.requesterId = requesterId;
        this.requestedForId = requestedForId;
        this.approverId = approverId;
        this.fieldsJson = fieldsJson;
        this.status = approverId == null ? RequestStatus.SUBMITTED : RequestStatus.PENDING_APPROVAL;
    }

    /** Pre-persist callback initializing createdAt and updatedAt timestamps. */
    @PrePersist
    void beforeInsert() { this.createdAt = Instant.now(); this.updatedAt = this.createdAt; }

    /** Pre-update callback refreshing the updatedAt timestamp. */
    @PreUpdate
    void beforeUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }

    /**
     * Resolves human-readable request number (ServiceNow RITM number or local NSR-YYYYMMDD-XXXXXXXX format).
     *
     * @return Formatted ticket number.
     */
    public String getRequestNumber() {
        if (serviceNowNumber != null && !serviceNowNumber.isBlank()) {
            return serviceNowNumber;
        }
        String compactId = id.toString().replace("-", "").substring(0, 8).toUpperCase();
        return "NSR-" + REQUEST_DATE.format(createdAt) + "-" + compactId;
    }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getServiceName() { return serviceName; }
    public String getDescription() { return description; }
    public String getRequesterId() { return requesterId; }
    public String getRequestedForId() { return requestedForId; }
    public String getApproverId() { return approverId; }
    public String getFieldsJson() { return fieldsJson; }
    public String getExternalId() { return externalId; }
    public String getExternalSystem() { return externalSystem; }
    public void setExternalLink(String externalId, String externalSystem) {
        this.externalId = externalId;
        this.externalSystem = externalSystem;
    }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public String getServiceNowNumber() { return serviceNowNumber; }
    public void setServiceNowNumber(String serviceNowNumber) { this.serviceNowNumber = serviceNowNumber; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
