package com.northstar.catalog.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Data transfer record encapsulating catalog search responses with cache provenance metadata.
 *
 * <p><b>Purpose:</b> Communicates the active catalog item list along with cache metadata, informing the client
 * whether data is live or served from a stale fallback cache.
 *
 * <p><b>Downstream / Workflow:</b> Serialized as JSON in response to {@code GET /api/catalog} and parsed by
 * the frontend portal to display catalog cards and warning banners if upstream ServiceNow is offline.
 *
 * @param stale {@code true} if upstream ServiceNow was unreachable and cached/fallback data is being served.
 * @param cachedAt Timestamp when the catalog records were cached.
 * @param items List of catalog item maps.
 */
public record CatalogResponse(boolean stale, Instant cachedAt, List<Map<String, Object>> items) {
}
