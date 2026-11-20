package com.northstar.incident.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record IncidentCommentInput(@NotBlank @Size(max=4000) String comment) {}
