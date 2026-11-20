package com.northstar.incident.dto;
import java.time.Instant;
import java.util.UUID;
public record IncidentResponse(UUID id,String title,String description,String category,String priority,String status,String reporterId,String assigneeId,Instant createdAt,Instant updatedAt) {}
