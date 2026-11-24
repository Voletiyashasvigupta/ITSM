package com.northstar.catalog.dto;

import java.util.List;

public record FormDefinitionDto(
    String itemId,
    String title,
    String intro,
    List<FormFieldDto> fields
) {
    public record FormFieldDto(
        String name,
        String label,
        String kind,
        List<String> options,
        boolean required,
        String helper
    ) {}
}
