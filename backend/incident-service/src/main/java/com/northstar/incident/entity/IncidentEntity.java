package com.northstar.incident.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class IncidentEntity {
    @Id private UUID id;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String description;
    @Column(nullable = false, length = 100) private String category;
    @Column(nullable = false, length = 16) private String priority;
    @Column(nullable = false, length = 24) private String status;
    @Column(name = "reporter_id", nullable = false, length = 128) private String reporterId;
    @Column(name = "assignee_id", length = 128) private String assigneeId;
    @Column(name = "external_id", length = 128) private String externalId;
    @Column(name = "external_system", length = 64) private String externalSystem;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected IncidentEntity() {}
    public IncidentEntity(String title, String description, String category, String priority, String reporterId) {
        this.id = UUID.randomUUID(); this.title = title; this.description = description; this.category = category;
        this.priority = priority; this.reporterId = reporterId; this.status = "OPEN"; this.createdAt = Instant.now(); this.updatedAt = this.createdAt;
    }
    public void updateStatus(String status) { this.status = status; this.updatedAt = Instant.now(); }
    public void addAssignee(String assigneeId) { this.assigneeId = assigneeId; this.updatedAt = Instant.now(); }
    public UUID getId() { return id; } public String getTitle() { return title; } public String getDescription() { return description; }
    public String getCategory() { return category; } public String getPriority() { return priority; } public String getStatus() { return status; }
    public String getReporterId() { return reporterId; } public String getAssigneeId() { return assigneeId; }
    public Instant getCreatedAt() { return createdAt; } public Instant getUpdatedAt() { return updatedAt; }
}
