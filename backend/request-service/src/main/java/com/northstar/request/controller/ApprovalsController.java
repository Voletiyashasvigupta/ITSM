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
 * approval history ({@code /api/approvals/history}), single approval inspection, and approve/reject actions.
 * Enforces that managers can approve only for employees within their assigned reporting hierarchy.
 */
@RestController
@RequestMapping("/api/approvals")
public class ApprovalsController {
    private final LocalApprovalService approvals;

    public ApprovalsController(LocalApprovalService approvals) {
        this.approvals = approvals;
    }

    /**
     * Retrieves the list of requests currently awaiting the caller's approval (or all pending if admin).
     */
    @GetMapping(value = {"/inbox", "/pending"})
    public List<?> inbox(@AuthenticationPrincipal Jwt jwt) {
        return approvals.pending(jwt.getSubject(), RequestController.isAdmin(jwt), RequestController.isManager(jwt));
    }

    /**
     * Retrieves the history of approvals already decided by the caller or within their reporting scope.
     */
    @GetMapping("/history")
    public List<?> history(@AuthenticationPrincipal Jwt jwt) {
        return approvals.history(jwt.getSubject(), RequestController.isAdmin(jwt), RequestController.isManager(jwt));
    }

    /**
     * Retrieves a specific approval record by ID.
     */
    @GetMapping("/{id}")
    public Object get(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt) {
        return approvals.get(id, jwt.getSubject(), RequestController.isAdmin(jwt), RequestController.isManager(jwt));
    }

    /**
     * Records an approval or rejection decision.
     */
    @PostMapping("/{id}/decision")
    public Object decision(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DecisionInput input) {
        boolean approve = "APPROVED".equalsIgnoreCase(input.decision()) || Boolean.TRUE.equals(input.approved());
        return approvals.decide(id, jwt.getSubject(), RequestController.isAdmin(jwt), approve, input.comment());
    }

    /**
     * Approves the target request.
     */
    @PostMapping("/{id}/approve")
    public Object approve(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody(required = false) DecisionInput input) {
        return approvals.decide(id, jwt.getSubject(), RequestController.isAdmin(jwt), true, input == null ? null : input.comment());
    }

    /**
     * Rejects the target request (requires a mandatory reason comment).
     */
    @PostMapping("/{id}/reject")
    public Object reject(@PathVariable("id") UUID id, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody(required = false) DecisionInput input) {
        String comment = input == null ? null : input.comment();
        return approvals.decide(id, jwt.getSubject(), RequestController.isAdmin(jwt), false, comment);
    }
}
