package com.northstar.catalog.dto;

import java.util.List;

/**
 * Data transfer record defining the dynamic input form schema for a service request.
 *
 * <p><b>Purpose:</b> Delivers dynamic field definitions, field types (text, textarea, select,
 * multi-select, checkbox, date, number, reference), validation constraints, dropdown options,
 * and conditional visibility/requirement rules so the frontend can render customized request forms.
 *
 * <p><b>Downstream / Workflow:</b> Provided by {@link com.northstar.catalog.controller.CatalogController#getForm(String)}
 * to the React frontend form generator.
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
     * Rule defining conditional visibility or requirement based on another field's value.
     *
     * @param dependsOn Field name to monitor.
     * @param value Expected value triggering this rule (e.g. "true", "Other", "Yes").
     * @param action "show" (display when value matches), "hide", or "require".
     */
    public record ConditionalRule(
        String dependsOn,
        String value,
        String action
    ) {}

    /**
     * Data transfer record describing an individual form input control.
     *
     * @param name Key name used in the JSON request payload.
     * @param label UI label displayed above the field.
     * @param kind Field control type: "text", "textarea", "select", "multi-select", "checkbox", "date", "number", "reference".
     * @param options Selectable choices when kind is "select" or "multi-select".
     * @param required Whether this field must be populated before submission.
     * @param helper Subtext or placeholder guidance.
     * @param condition Optional conditional display or requirement rule.
     */
    public record FormFieldDto(
        String name,
        String label,
        String kind,
        List<String> options,
        boolean required,
        String helper,
        ConditionalRule condition
    ) {
        public FormFieldDto(String name, String label, String kind, List<String> options, boolean required, String helper) {
            this(name, label, kind, options, required, helper, null);
        }
    }
}
