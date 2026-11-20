package com.northstar.incident.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
public record IncidentInput(@NotBlank @Size(max=200) String title,@NotBlank @Size(max=10000) String description,@NotBlank @Size(max=100) String category,@NotBlank @Pattern(regexp="LOW|MEDIUM|HIGH|CRITICAL") String priority) {}
