package com.northstar.request.dto;
import java.time.Instant;
import java.util.UUID;
public record ApprovalResponse(UUID id,UUID requestId,String requestNumber,String serviceName,String requesterId,String approverId,String decision,String comment,Instant createdAt,Instant decidedAt) {}
