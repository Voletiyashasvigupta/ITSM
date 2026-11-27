package com.northstar.catalog.dto;

import java.util.List;

/**
 * Data transfer record defining the dynamic input form schema for a service request.
 *
 * <p><b>Purpose:</b> Delivers dynamic field definitions, field types, validation constraints, and dropdown options
 * so the frontend can render customized request forms without hardcoded UI schemas.
 *
 * <p><b>Downstream / Workflow:</b> Provided by {@link com.northstar.catalog.controller.CatalogController#getForm(String)}
 * to the React frontend form generator. Field inputs entered by the user are subsequently sent to the Request Service.
 *
 * @param itemId The catalog item identifier.
 * @param title Form display title.
 * @param intro Guidance instructions shown to the employee before completing the form.
 * @param fields List of interactive field definitions.
 */
public record FormDefinitionDto(
    String itemId,
    String title,
    String intro,
    List<FormFieldDto> fields
) {
    /**
     * Data transfer record describing an individual form input control.
     *
     * <p><b>Purpose:</b> Configures UI input type, label, requirement rule, help text, and selection choices.
     *
     * <p><b>Downstream / Workflow:</b> Rendered by frontend components into MUI text inputs, selects, or radio groups.
     *
     * @param name Key name used in the JSON request payload.
     * @param label UI label displayed above the field.
     * @param kind Field control type (e.g. "text", "textarea", "select", "date").
     * @param options Selectable choices when kind is "select".
     * @param required Whether this field must be populated before submission.
     * @param helper Subtext or placeholder guidance.
     */
    public record FormFieldDto(
        String name,
        String label,
        String kind,
        List<String> options,
        boolean required,
        String helper
    ) {}
}
