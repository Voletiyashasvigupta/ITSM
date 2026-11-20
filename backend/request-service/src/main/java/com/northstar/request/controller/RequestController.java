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

@RestController
@RequestMapping("/api/requests")
public class RequestController {
    private final RequestSubmissionService submissions;
    private final LocalRequestService requests;

    public RequestController(RequestSubmissionService submissions, LocalRequestService requests) {
        this.submissions = submissions; this.requests = requests;
    }

    @GetMapping
    public org.springframework.data.domain.Page<RequestDetailsResponse> list(@AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return requests.list(jwt.getSubject(), isManager(jwt), pageable);
    }

    @GetMapping("/{id}")
    public RequestDetailsResponse get(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) { return requests.get(id,jwt.getSubject(),isManager(jwt)); }

    @GetMapping("/{id}/history")
    public List<RequestHistoryResponse> history(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) { return requests.history(id,jwt.getSubject(),isManager(jwt)); }

    @PatchMapping("/{id}/status")
    public RequestDetailsResponse updateStatus(@PathVariable("id") UUID id,@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody RequestStatusInput input) {
        if(!isManager(jwt)) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"Manager or administrator role required");
        return requests.transition(id,jwt.getSubject(),input.status());
    }

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

    static boolean isManager(Jwt jwt) {
        Object claim=jwt.getClaims().get("roles");
        return claim instanceof Collection<?> values && values.stream().anyMatch("MANAGER_ADMIN"::equals);
    }
}
