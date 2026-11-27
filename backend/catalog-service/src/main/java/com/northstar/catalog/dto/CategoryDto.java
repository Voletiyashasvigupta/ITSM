package com.northstar.catalog.dto;

import java.util.List;

/**
 * Data transfer record describing a service catalog category.
 *
 * <p><b>Purpose:</b> Groups related service catalog offerings (e.g. IT, Facilities, HR/People) for UI navigation.
 *
 * <p><b>Downstream / Workflow:</b> Returned by {@link com.northstar.catalog.controller.CatalogController#categories()}
 * to the frontend portal navigation bar and dashboard grids.
 *
 * @param id Category unique slug/identifier (e.g., "it-services").
 * @param name User-facing display title.
 * @param description Detailed summary of offerings within this category.
 */
public record CategoryDto(String id, String name, String description) {}
