package com.northstar.catalog.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.northstar.catalog.integration.ServiceNowCatalogClient;
import com.northstar.catalog.dto.CatalogResponse;
import java.time.Duration;
import java.time.Instant;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final ServiceNowCatalogClient serviceNow;

    public CatalogController(StringRedisTemplate redis, ObjectMapper mapper, ServiceNowCatalogClient serviceNow) {
        this.redis = redis;
        this.mapper = mapper;
        this.serviceNow = serviceNow;
    }

    @GetMapping
    public CatalogResponse list(@RequestParam(name = "limit", defaultValue = "50") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        String cacheKey = "catalog:items:" + safeLimit;
        String cached = null;
        try {
            cached = redis.opsForValue().get(cacheKey);
        } catch (RuntimeException ignored) {
            // A cache outage must not prevent a healthy ServiceNow read.
        }

        try {
            JsonNode items = serviceNow.list(safeLimit);
            CatalogResponse response = new CatalogResponse(false, Instant.now(), items);
            try {
                redis.opsForValue().set(cacheKey, mapper.writeValueAsString(response), CACHE_TTL);
            } catch (JsonProcessingException | RuntimeException ignored) {
                // Serve the fresh ServiceNow response even when the cache is unavailable.
            }
            return response;
        } catch (Exception exception) {
            if (cached != null) {
                try {
                    CatalogResponse lastKnown = mapper.readValue(cached, CatalogResponse.class);
                    return new CatalogResponse(true, lastKnown.cachedAt(), lastKnown.items());
                } catch (JsonProcessingException ignored) {
                    // Corrupt cache entries are treated as unavailable.
                }
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Catalog is unavailable and no cached copy exists");
        }
    }

}

