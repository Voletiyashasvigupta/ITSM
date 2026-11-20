package com.northstar.catalog.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record CatalogResponse(boolean stale, Instant cachedAt, JsonNode items) {
}
