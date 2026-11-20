package com.northstar.request.dto;
import com.northstar.request.entity.RequestStatus;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
public record RequestDetailsResponse(UUID id, String requestNumber, String serviceName, String description, String requesterId,
        String requestedForId, String approverId, RequestStatus status, String externalId, String externalSystem,
        Map<String, String> fields, Instant createdAt, Instant updatedAt) {}
