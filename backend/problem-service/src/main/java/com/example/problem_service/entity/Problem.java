package com.example.problem_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "problems")
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String problemNumber;

    @NotBlank(message = "Problem title cannot be empty")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private String priority;
    private String status;

    private String assignedTo; // legacy field retained for compatibility
    private String assignedAnalyst;
    private String assignedEngineer;

    @Column(columnDefinition = "TEXT")
    private String investigationNotes;

    @Column(columnDefinition = "TEXT")
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String workaround;

    @Column(columnDefinition = "TEXT")
    private String knownError;

    @Column(columnDefinition = "TEXT")
    private String technicalNotes;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Problem() {}

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;

        if (status == null || status.isBlank()) {
            status = "OPEN";
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long v) {
        id = v;
    }

    public String getProblemNumber() {
        return problemNumber;
    }

    public void setProblemNumber(String v) {
        problemNumber = v;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String v) {
        category = v;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String v) {
        priority = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String v) {
        assignedTo = v;
    }

    public String getAssignedAnalyst() {
        return assignedAnalyst;
    }

    public void setAssignedAnalyst(String v) {
        assignedAnalyst = v;
    }

    public String getAssignedEngineer() {
        return assignedEngineer;
    }

    public void setAssignedEngineer(String v) {
        assignedEngineer = v;
    }

    public String getInvestigationNotes() {
        return investigationNotes;
    }

    public void setInvestigationNotes(String v) {
        investigationNotes = v;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String v) {
        rootCause = v;
    }

    public String getWorkaround() {
        return workaround;
    }

    public void setWorkaround(String v) {
        workaround = v;
    }

    public String getKnownError() {
        return knownError;
    }

    public void setKnownError(String v) {
        knownError = v;
    }

    public String getTechnicalNotes() {
        return technicalNotes;
    }

    public void setTechnicalNotes(String v) {
        technicalNotes = v;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String v) {
        resolution = v;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String v) {
        createdBy = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime v) {
        createdAt = v;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime v) {
        updatedAt = v;
    }
}