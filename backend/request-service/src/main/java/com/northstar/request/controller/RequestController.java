package com.northstar.request.controller;

import com.northstar.request.dto.*;

import com.northstar.request.service.RequestSubmissionService;
import com.northstar.request.service.LocalRequestService;
import jakarta.validation.Valid;
import java.util.Collection;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import java.util.UUID;

/**
 * REST controller for submitting, viewing, canceling, and updating service requests.
 *
 * <p><b>Purpose:</b> Fronts the employee service request intake portal. Handles idempotent submissions
 * ({@code POST /api/requests}), paginated request listings scoped by user or supervisor, detailed ticket inspection,
 * timeline audits, cancellations, and manager status transitions.
 *
 * <p><b>Downstream / Workflow:</b> Receives HTTP traffic forwarded by the API Gateway under {@code /api/requests/**}.
 * Delegates submissions to {@link RequestSubmissionService} and retrieval/lifecycle actions to {@link LocalRequestService}.
 */
@RestController
@RequestMapping("/api/requests")
public class RequestController {
    private final RequestSubmissionService submissions;
    private final LocalRequestService requests;

    /**
     * Constructs the RequestController.
     *
     * @param submissions Service handling idempotent request submissions and transactional outbox.
     * @param requests Service handling query, cancellation, and status workflows.
     */
    public RequestController(RequestSubmissionService submissions, LocalRequestService requests) {
        this.submissions = submissions; this.requests = requests;
    }

    /**
     * Lists service requests for the caller, or all requests if the caller is a manager/admin.
     *
     * @param jwt Caller JWT principal.
     * @param pageable Pagination and sorting criteria.
     * @return Paginated list of RequestDetailsResponse.
     */
    @GetMapping
    public org.springframework.data.domain.Page<RequestDetailsResponse> list(@AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return requests.list(jwt.getSubject(), isManager(jwt), pageable);
    }

    /**
     * Pre-generates the next sequential human-readable request number (REQ0010001).
     *
     * @return Map with "number" key.
     */
    @GetMapping("/next-number")
    public java.util.Map<String, String> nextNumber() {
        return java.util.Map.of("number", requests.generateNextNumber());
    }

    /**
     * Retrieves full details for a single service request.
     *
     * @param id Request UUID.
     * @param jwt Caller JWT principal.
     * @return RequestDetailsResponse.
     */
    @GetMapping("/{id}")
    public RequestDetailsResponse get(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) { return requests.get(id,jwt.getSubject(),isManager(jwt)); }

    /**
     * Retrieves chronological audit and status transition timeline for a request.
     *
     * @param id Request UUID.
     * @param jwt Caller JWT principal.
     * @return List of RequestHistoryResponse events.
     */
    @GetMapping(value = {"/{id}/timeline", "/{id}/history"})
    public List<RequestHistoryResponse> history(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) { return requests.history(id,jwt.getSubject(),isManager(jwt)); }

    /**
     * Cancels an eligible pending request.
     *
     * @param id Request UUID.
     * @param jwt Caller JWT principal.
     * @return Updated RequestDetailsResponse.
     */
    @PostMapping("/{id}/cancel")
    public RequestDetailsResponse cancel(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) {
        return requests.cancel(id, jwt.getSubject(), isManager(jwt));
    }

    /**
     * Updates request status through the request state machine (restricted to managers/admins).
     *
     * @param id Request UUID.
     * @param jwt Caller JWT principal.
     * @param input Updated status target.
     * @return Updated RequestDetailsResponse.
     */
    @PatchMapping("/{id}/status")
    public RequestDetailsResponse updateStatus(@PathVariable("id") UUID id,@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody RequestStatusInput input) {
        if(!isManager(jwt)) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"Manager or administrator role required");
        return requests.transition(id,jwt.getSubject(),input.status());
    }

    /**
     * Accepts and persists an idempotent service catalog request submission.
     *
     * <p><b>Purpose:</b> Implements transactional submission: saves service request row, initial approval row,
     * history row, and outbox event in a single database transaction. Returns HTTP 202 Accepted.
     *
     * @param idempotencyKey Required Idempotency-Key header for duplicate protection.
     * @param gatewayIdentity X-Authenticated-User header injected by the Gateway.
     * @param jwt Caller JWT principal.
     * @param input Validated form payload.
     * @return RequestSubmissionResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public RequestSubmissionResponse submit(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "X-Authenticated-User", required = false) String gatewayIdentity,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody RequestSubmission input) {
        Object roleClaim = jwt.getClaims().get("roles");
        List<String> roles = roleClaim instanceof Collection<?> values
                ? values.stream().filter(String.class::isInstance).map(String.class::cast).toList()
                : List.of();
        return submissions.submit(idempotencyKey, jwt.getSubject(), roles, gatewayIdentity, input);
    }

    /**
     * Checks if caller holds the MANAGER_ADMIN authority.
     *
     * @param jwt Caller JWT.
     * @return {@code true} if manager/admin.
     */
    static boolean isManager(Jwt jwt) {
        Object claim=jwt.getClaims().get("roles");
        return claim instanceof Collection<?> values && values.stream().anyMatch("MANAGER_ADMIN"::equals);
    }
}
