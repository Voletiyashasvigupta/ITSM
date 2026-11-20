package com.northstar.incident.controller;

import com.northstar.incident.dto.IncidentCommentInput;
import com.northstar.incident.dto.IncidentInput;
import com.northstar.incident.dto.IncidentStatusInput;
import com.northstar.incident.service.LocalIncidentService;
import jakarta.validation.Valid;
import java.util.Collection;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/incidents")
public class IncidentsController {
    private final LocalIncidentService incidents;

    public IncidentsController(LocalIncidentService incidents) {
        this.incidents = incidents;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody IncidentInput input) {
        return incidents.create(jwt.getSubject(), input);
    }

    @GetMapping
    public Object list(@AuthenticationPrincipal Jwt jwt) {
        return incidents.list(jwt.getSubject(), hasSupportRole(jwt));
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) {
        return incidents.detail(id, jwt.getSubject(), hasSupportRole(jwt));
    }

    @PatchMapping("/{id}/status")
    public Object update(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IncidentStatusInput input) {
        return incidents.update(id, jwt.getSubject(), hasSupportRole(jwt), input);
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public Object comment(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IncidentCommentInput input) {
        return incidents.comment(id, jwt.getSubject(), hasSupportRole(jwt), input.comment());
    }

    private static boolean hasSupportRole(Jwt jwt) {
        Object claim = jwt.getClaims().get("roles");
        return claim instanceof Collection<?> values && values.stream().anyMatch("MANAGER_ADMIN"::equals);
    }
}

