package com.northstar.request.dto;

import com.northstar.request.entity.RequestStatus;
import java.time.Instant;
import java.util.UUID;

public record RequestSubmissionResponse(UUID id, String requestNumber, String serviceName, String requesterId,
                                        String requestedForId, RequestStatus status,
                                        String serviceNowNumber, Instant createdAt) {}
