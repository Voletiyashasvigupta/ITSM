package com.northstar.incident.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

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

    protected IncidentEntity() {}

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

    public void updateStatus(String status) {
        this.status = status;
        this.state = status;
        this.updatedAt = Instant.now();
    }

    public void updateState(String state) {
        this.state = state;
        this.status = state.toUpperCase().replace(" ", "_");
        this.updatedAt = Instant.now();
    }

    public void addAssignee(String assigneeId) {
        this.assigneeId = assigneeId;
        this.assignedTo = assigneeId;
        this.updatedAt = Instant.now();
    }

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

    public void setIncidentNumber(String incidentNumber) { this.incidentNumber = incidentNumber; }
}
