package com.northstar.incident.dto;
import jakarta.validation.constraints.Pattern;
public record IncidentStatusInput(@Pattern(regexp="OPEN|IN_PROGRESS|RESOLVED|CLOSED") String status,String assigneeId) {}
