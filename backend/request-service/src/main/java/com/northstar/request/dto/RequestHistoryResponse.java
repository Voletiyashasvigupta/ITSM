package com.northstar.request.dto;
import java.time.Instant;
import java.util.UUID;
public record RequestHistoryResponse(UUID id, String actorId, String action, String fromStatus, String toStatus, String comment, Instant createdAt) {}
