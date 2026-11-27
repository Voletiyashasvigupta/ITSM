package com.northstar.incident.controller;

import com.northstar.incident.dto.IncidentCommentInput;
import com.northstar.incident.dto.IncidentInput;
import com.northstar.incident.dto.IncidentStatusInput;
import com.northstar.incident.service.LocalIncidentService;
import jakarta.validation.Valid;
import java.util.Collection;
import java.util.Map;
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

/**
 * REST controller exposing endpoints for incident creation, listing, detail viewing, status updates, and comments.
 *
 * <p><b>Purpose:</b> Fronts the incident management API for the Northstar portal, extracting user identity
 * from the security JWT and checking role claims to determine permissions.
 *
 * <p><b>Downstream / Workflow:</b> Intercepts incoming HTTP requests routed to {@code /api/incidents/**}
 * and delegates to {@link LocalIncidentService}.
 */
@RestController
@RequestMapping("/api/incidents")
public class IncidentsController {
    private final LocalIncidentService incidents;

    /**
     * Constructs the IncidentsController.
     *
     * <p><b>Purpose:</b> Dependency injection of the incident service.
     *
     * <p><b>Downstream / Workflow:</b> Spring initializes this bean at application startup.
     *
     * @param incidents The incident service.
     */
    public IncidentsController(LocalIncidentService incidents) {
        this.incidents = incidents;
    }

    /**
     * Generates and returns the next anticipated incident number.
     *
     * <p><b>Purpose:</b> Pre-populates the incident ID field on creation forms.
     *
     * <p><b>Downstream / Workflow:</b> Called on {@code GET /api/incidents/next-number}.
     *
     * @return Map containing "number" key with generated incident ID.
     */
    @GetMapping("/next-number")
    public Map<String, String> nextNumber() {
        return Map.of("number", incidents.generateNextNumber());
    }

    /**
     * Creates a new incident ticket for the authenticated caller.
     *
     * <p><b>Purpose:</b> Submits a new incident.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link LocalIncidentService#create(String, IncidentInput)}. Returns HTTP 201 Created.
     *
     * @param jwt Caller JWT principal.
     * @param input Incident form inputs.
     * @return Created incident response.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody IncidentInput input) {
        return incidents.create(jwt.getSubject(), input);
    }

    /**
     * Lists incidents for the authenticated user, or all incidents if the user has support authority.
     *
     * <p><b>Purpose:</b> Incident table directory listing.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link LocalIncidentService#list(String, boolean)}.
     *
     * @param jwt Caller JWT principal.
     * @return List of incident responses.
     */
    @GetMapping
    public Object list(@AuthenticationPrincipal Jwt jwt) {
        return incidents.list(jwt.getSubject(), hasSupportRole(jwt));
    }

    /**
     * Retrieves detail and comment history for a specific incident.
     *
     * <p><b>Purpose:</b> Fetches full incident details with access check.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link LocalIncidentService#detail(UUID, String, boolean)}.
     *
     * @param id Incident UUID.
     * @param jwt Caller JWT principal.
     * @return IncidentDetailResponse.
     */
    @GetMapping("/{id}")
    public Object get(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) {
        return incidents.detail(id, jwt.getSubject(), hasSupportRole(jwt));
    }

    /**
     * Updates an incident's state, status, or assigned agent.
     *
     * <p><b>Purpose:</b> Status updates restricted to support roles.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link LocalIncidentService#update(UUID, String, boolean, IncidentStatusInput)}.
     *
     * @param id Incident UUID.
     * @param jwt Caller JWT principal.
     * @param input Updated fields.
     * @return Updated incident response.
     */
    @PatchMapping("/{id}/status")
    public Object update(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IncidentStatusInput input) {
        return incidents.update(id, jwt.getSubject(), hasSupportRole(jwt), input);
    }

    /**
     * Posts a new comment to an incident.
     *
     * <p><b>Purpose:</b> Communication notes on tickets.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link LocalIncidentService#comment(UUID, String, boolean, String)}. Returns HTTP 201 Created.
     *
     * @param id Incident UUID.
     * @param jwt Caller JWT principal.
     * @param input Comment input.
     * @return Created comment entity.
     */
    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public Object comment(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IncidentCommentInput input) {
        return incidents.comment(id, jwt.getSubject(), hasSupportRole(jwt), input.comment());
    }

    /**
     * Evaluates whether the caller holds the support / manager-admin role.
     *
     * <p><b>Purpose:</b> Helper role inspection against JWT claims.
     *
     * <p><b>Downstream / Workflow:</b> Used across controller endpoints.
     *
     * @param jwt Caller JWT.
     * @return {@code true} if caller has MANAGER_ADMIN role.
     */
    private static boolean hasSupportRole(Jwt jwt) {
        Object claim = jwt.getClaims().get("roles");
        return claim instanceof Collection<?> values && values.stream().anyMatch("MANAGER_ADMIN"::equals);
    }
}
