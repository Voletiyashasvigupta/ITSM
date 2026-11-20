package com.northstar.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record RequestSubmission(
        @NotBlank @Size(max = 200) String serviceName,
        @NotBlank @Size(max = 10000) String description,
        @Size(max = 128) String requestedForId,
        @Size(max = 128) String approverId,
        Map<String, String> fields) {}
