package com.northstar.request.controller;

import com.northstar.request.dto.*;
import com.northstar.request.service.LocalApprovalService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for manager and approver decisions on service requests.
 *
 * <p><b>Purpose:</b> Serves the approval workflow: pending approval inbox ({@code /api/approvals/pending}),
 * approval history ({@code /api/approvals/history}), single approval inspection, and approve/reject actions
 * ({@code /api/approvals/{id}/approve}, {@code /api/approvals/{id}/reject}).
 *
 * <p><b>Downstream / Workflow:</b> Receives client requests forwarded through the API Gateway,
 * verifies approver ownership, and delegates state updates to {@link LocalApprovalService}.
 */
@RestController
@RequestMapping("/api/approvals")
public class ApprovalsController {
    private final LocalApprovalService approvals;

    /**
     * Constructs the ApprovalsController.
     *
     * @param approvals Service managing approval queries and decision state updates.
     */
    public ApprovalsController(LocalApprovalService approvals) {
        this.approvals = approvals;
    }

    /**
     * Retrieves the list of requests currently awaiting the caller's approval (or all pending if manager).
     *
     * @param jwt Caller JWT principal.
     * @return List of pending approval responses.
     */
    @GetMapping(value = {"/inbox", "/pending"})
    public List<?> inbox(@AuthenticationPrincipal Jwt jwt) {
        return approvals.pending(jwt.getSubject(), RequestController.isManager(jwt));
    }

    /**
     * Retrieves the history of approvals already decided by the caller.
     *
     * @param jwt Caller JWT principal.
     * @return List of historical approval records.
     */
    @GetMapping("/history")
    public List<?> history(@AuthenticationPrincipal Jwt jwt) {
        return approvals.history(jwt.getSubject(), RequestController.isManager(jwt));
    }

    /**
     * Retrieves a specific approval record by ID.
     *
     * @param id Approval UUID.
     * @param jwt Caller JWT principal.
     * @return ApprovalResponse.
     */
    @GetMapping("/{id}")
    public Object get(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) {
        return approvals.get(id, jwt.getSubject(), RequestController.isManager(jwt));
    }

    /**
     * Records an approval or rejection decision.
     *
     * @param id Approval UUID.
     * @param jwt Caller JWT principal.
     * @param input DecisionInput with decision boolean and comments.
     * @return Updated approval record.
     */
    @PostMapping("/{id}/decision")
    public Object decision(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DecisionInput input) {
        boolean approve = "APPROVED".equalsIgnoreCase(input.decision()) || Boolean.TRUE.equals(input.approved());
        return approvals.decide(id, jwt.getSubject(), approve, input.comment());
    }

    /**
     * Approves the target request.
     *
     * @param id Approval UUID.
     * @param jwt Caller JWT principal.
     * @param input Optional comments.
     * @return Updated approval record.
     */
    @PostMapping("/{id}/approve")
    public Object approve(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody(required = false) DecisionInput input) {
        return approvals.decide(id, jwt.getSubject(), true, input == null ? null : input.comment());
    }

    /**
     * Rejects the target request (requires a mandatory reason comment).
     *
     * @param id Approval UUID.
     * @param jwt Caller JWT principal.
     * @param input Mandatory comment payload.
     * @return Updated approval record.
     */
    @PostMapping("/{id}/reject")
    public Object reject(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DecisionInput input) {
        return approvals.decide(id, jwt.getSubject(), false, input.comment());
    }
}
