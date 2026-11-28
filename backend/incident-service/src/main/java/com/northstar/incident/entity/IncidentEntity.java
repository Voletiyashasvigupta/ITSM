package com.northstar.incident.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing an ITIL Incident ticket stored in the {@code incidents} table.
 *
 * <p><b>Purpose:</b> Models complete incident lifecycle data including incident numbers (INC001...),
 * caller, category/subcategory, business service, channel, state, impact, urgency, matrix priority,
 * assignment, and work descriptions. Supports backward compatibility with legacy title/status columns.
 *
 * <p><b>Downstream / Workflow:</b> Managed by {@link com.northstar.incident.repository.IncidentRepository} and
 * updated by {@link com.northstar.incident.service.LocalIncidentService}. Displayed on the employee and support agent portals.
 */
@Entity
@Table(name = "incidents")
public class IncidentEntity {
    @Id
    private UUID id;

    @Column(name = "incident_number", length = 32)
    private String incidentNumber;

    @Column(length = 128)
    private String caller;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 100)
    private String subcategory;

    @Column(length = 100)
    private String service;

    @Column(name = "service_offering", length = 100)
    private String serviceOffering;

    @Column(length = 50)
    private String channel;

    @Column(length = 32)
    private String state;

    @Column(length = 32)
    private String impact;

    @Column(length = 32)
    private String urgency;

    @Column(nullable = false, length = 32)
    private String priority;

    @Column(name = "assigned_to", length = 128)
    private String assignedTo;

    @Column(name = "assignment_group", length = 128)
    private String assignmentGroup;

    @Column(name = "correlation_id", length = 128)
    private String correlationId;

    @Column(name = "sync_status", length = 32)
    private String syncStatus;

    @Column(name = "sync_error", length = 500)
    private String syncError;

    @Column(name = "sync_attempts")
    private Integer syncAttempts;

    @Column(name = "next_sync_attempt_at")
    private Instant nextSyncAttemptAt;

    @Column(name = "short_description", length = 255)
    private String shortDescription;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // Backward compatibility fields
    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "reporter_id", nullable = false, length = 128)
    private String reporterId;

    @Column(name = "assignee_id", length = 128)
    private String assigneeId;

    @Column(name = "external_id", length = 128)
    private String externalId;

    @Column(name = "external_system", length = 64)
    private String externalSystem;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Protected no-arg constructor for JPA. */
    protected IncidentEntity() {}

    /**
     * Constructs a new IncidentEntity with full ITIL attributes and default fallback values.
     *
     * <p><b>Purpose:</b> Initializes a new incident record and synchronizes legacy compatibility fields.
     *
     * <p><b>Downstream / Workflow:</b> Called when creating an incident from {@link com.northstar.incident.dto.IncidentInput}.
     */
    public IncidentEntity(String incidentNumber, String caller, String category, String subcategory,
                          String service, String serviceOffering,
                          String channel, String state, String impact, String urgency,
                          String priority, String assignedTo,
                          String shortDescription, String description, String reporterId) {
        this.id = UUID.randomUUID();
        this.incidentNumber = incidentNumber;
        this.caller = (caller != null && !caller.isBlank()) ? caller : reporterId;
        this.category = (category != null && !category.isBlank()) ? category : "Inquiry / Help";
        this.subcategory = subcategory;
        this.service = service;
        this.serviceOffering = serviceOffering;
        this.channel = (channel != null && !channel.isBlank()) ? channel : "-- None --";
        this.state = (state != null && !state.isBlank()) ? state : "New";
        this.impact = (impact != null && !impact.isBlank()) ? impact : "3 - Low";
        this.urgency = (urgency != null && !urgency.isBlank()) ? urgency : "3 - Low";
        this.priority = (priority != null && !priority.isBlank()) ? priority : "4 - Low";
        this.assignedTo = assignedTo;
        this.shortDescription = (shortDescription != null && !shortDescription.isBlank()) ? shortDescription : "Incident";
        this.description = description;

        // Sync legacy fields
        this.title = this.shortDescription;
        this.status = this.state.toUpperCase().replace(" ", "_");
        this.reporterId = reporterId;
        this.assigneeId = assignedTo;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    /**
     * Updates legacy status and state strings with timestamp refresh.
     *
     * <p><b>Purpose:</b> Transitions ticket status.
     *
     * <p><b>Downstream / Workflow:</b> Called by service layer status transition handlers.
     *
     * @param status New status string.
     */
    public void updateStatus(String status) {
        this.status = status;
        this.state = status;
        this.updatedAt = Instant.now();
    }

    /**
     * Updates state name and synchronizes uppercase status string.
     *
     * <p><b>Purpose:</b> ITIL state progression (e.g. New -> In Progress -> Resolved).
     *
     * <p><b>Downstream / Workflow:</b> Called during administrative updates.
     *
     * @param state New state label.
     */
    public void updateState(String state) {
        this.state = state;
        this.status = state.toUpperCase().replace(" ", "_");
        this.updatedAt = Instant.now();
    }

    /**
     * Assigns the incident to a support staff member.
     *
     * <p><b>Purpose:</b> Sets ticket owner.
     *
     * <p><b>Downstream / Workflow:</b> Refreshes assignee fields and updated_at timestamp.
     *
     * @param assigneeId Support staff identifier.
     */
    public void addAssignee(String assigneeId) {
        this.assigneeId = assigneeId;
        this.assignedTo = assigneeId;
        this.updatedAt = Instant.now();
    }

    /**
     * Bulk updates incident fields with non-null incoming values.
     *
     * <p><b>Purpose:</b> Applies partial field modifications from update forms.
     *
     * <p><b>Downstream / Workflow:</b> Called by {@link com.northstar.incident.service.LocalIncidentService#updateIncident(UUID, com.northstar.incident.dto.IncidentInput)}.
     */
    public void updateFields(String category, String subcategory, String service, String serviceOffering,
                             String channel, String state, String impact,
                             String urgency, String priority, String assignedTo,
                             String shortDescription, String description) {
        if (category != null) this.category = category;
        if (subcategory != null) this.subcategory = subcategory;
        if (service != null) this.service = service;
        if (serviceOffering != null) this.serviceOffering = serviceOffering;
        if (channel != null) this.channel = channel;
        if (state != null) updateState(state);
        if (impact != null) this.impact = impact;
        if (urgency != null) this.urgency = urgency;
        if (priority != null) this.priority = priority;
        if (assignedTo != null) addAssignee(assignedTo);
        if (shortDescription != null) {
            this.shortDescription = shortDescription;
            this.title = shortDescription;
        }
        if (description != null) this.description = description;
        this.updatedAt = Instant.now();
    }

    // Getters
    public UUID getId() { return id; }
    public String getIncidentNumber() { return incidentNumber; }
    public String getCaller() { return caller; }
    public String getCategory() { return category; }
    public String getSubcategory() { return subcategory; }
    public String getService() { return service; }
    public String getServiceOffering() { return serviceOffering; }
    public String getChannel() { return channel; }
    public String getState() { return state != null ? state : status; }
    public String getImpact() { return impact; }
    public String getUrgency() { return urgency; }
    public String getPriority() { return priority; }
    public String getAssignedTo() { return assignedTo != null ? assignedTo : assigneeId; }
    public String getShortDescription() { return shortDescription != null ? shortDescription : title; }
    public String getDescription() { return description; }
    public String getTitle() { return title != null ? title : shortDescription; }
    public String getStatus() { return status != null ? status : state; }
    public String getReporterId() { return reporterId; }
    public String getAssigneeId() { return assigneeId; }
    public String getExternalId() { return externalId; }
    public String getExternalSystem() { return externalSystem; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public String getAssignmentGroup() { return assignmentGroup; }
    public String getCorrelationId() { return correlationId; }
    public String getSyncStatus() { return syncStatus; }
    public String getSyncError() { return syncError; }
    public Integer getSyncAttempts() { return syncAttempts; }
    public Instant getNextSyncAttemptAt() { return nextSyncAttemptAt; }

    public void setAssignmentGroup(String assignmentGroup) { this.assignmentGroup = assignmentGroup; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    public void setSyncStatus(String syncStatus) { this.syncStatus = syncStatus; }
    public void setSyncError(String syncError) { this.syncError = syncError; }
    public void setSyncAttempts(Integer syncAttempts) { this.syncAttempts = syncAttempts; }
    public void setNextSyncAttemptAt(Instant nextSyncAttemptAt) { this.nextSyncAttemptAt = nextSyncAttemptAt; }

    public void setIncidentNumber(String incidentNumber) { this.incidentNumber = incidentNumber; }
    public void setExternalLink(String externalId, String externalSystem) {
        this.externalId = externalId;
        this.externalSystem = externalSystem;
    }
}
