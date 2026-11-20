package com.northstar.request.dto;
import com.northstar.request.entity.RequestStatus;
import jakarta.validation.constraints.NotNull;
public record RequestStatusInput(@NotNull RequestStatus status) {}
