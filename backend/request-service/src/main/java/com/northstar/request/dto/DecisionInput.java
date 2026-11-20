package com.northstar.request.dto;
import jakarta.validation.constraints.Size;
public record DecisionInput(@Size(max = 2000) String comment) {}
