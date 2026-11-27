package com.example.problem_service.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;

import com.example.problem_service.service.ProblemService;
import com.example.problem_service.entity.Problem;

import java.util.*;

/**
 * REST controller providing API endpoints for ITIL Problem Management.
 *
 * <p><b>Purpose:</b> Exposes operations to create, list, inspect, triage, investigate, resolve, and delete
 * problem records. Maps authenticated user credentials and roles to appropriate lifecycle transitions.
 *
 * <p><b>Downstream / Workflow:</b> Receives client HTTP calls routed under {@code /api/problems/**} and delegates
 * to {@link ProblemService}.
 */
@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    private final ProblemService service;

    /**
     * Constructs the ProblemController with ProblemService.
     *
     * @param service Problem business service.
     */
    public ProblemController(ProblemService service) {
        this.service = service;
    }

    /**
     * Creates a new problem record.
     *
     * <p><b>Purpose:</b> Initiates a problem investigation, stamping the caller's email as creator.
     *
     * <p><b>Downstream / Workflow:</b> Dispatches to {@link ProblemService#createProblem(Problem)}.
     *
     * @param p Validated Problem entity payload.
     * @param a Spring Security Authentication principal.
     * @return Created Problem entity.
     */
    @PostMapping
    public Problem create(@Valid @RequestBody Problem p, Authentication a) {
        p.setCreatedBy(a.getName());
        if (p.getStatus() == null || p.getStatus().isBlank()) {
            p.setStatus("OPEN");
        }
        return service.createProblem(p);
    }

    /**
     * Lists all problems registered in the system.
     *
     * <p><b>Purpose:</b> Problem directory and queue overview.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#getAllProblems()}.
     *
     * @param a Authentication principal.
     * @return List of Problem entities.
     */
    @GetMapping
    public List<Problem> list(Authentication a) {
        return service.getAllProblems();
    }

    /**
     * Retrieves a single problem record by numeric ID.
     *
     * <p><b>Purpose:</b> Fetches detailed problem record.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#getProblemById(Long)}.
     *
     * @param id Numeric problem ID.
     * @param a Authentication principal.
     * @return Problem entity.
     */
    @GetMapping("/{id}")
    public Problem get(@PathVariable Long id, Authentication a) {
        return service.getProblemById(id);
    }

    /**
     * Updates problem management triage attributes (category, priority, analyst, engineer).
     *
     * <p><b>Purpose:</b> Manager triage and work allocation.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#managerUpdate(Long, String, String, String, String)}.
     *
     * @param id Problem ID.
     * @param body JSON map of attributes.
     * @param a Authentication principal.
     * @return Updated Problem.
     */
    @PutMapping("/{id}/management")
    public Problem management(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        return service.managerUpdate(
                id,
                body.get("category"),
                body.get("priority"),
                body.get("assignedAnalyst"),
                body.get("assignedEngineer"));
    }

    /**
     * Records problem investigation notes, root-cause findings, workarounds, and known errors.
     *
     * <p><b>Purpose:</b> Analyst investigation workflow.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#analystUpdate(Long, String, String, String, String, String)}.
     *
     * @param id Problem ID.
     * @param body JSON map with notes, rootCause, workaround, knownError, status.
     * @param a Authentication principal.
     * @return Updated Problem.
     */
    @PutMapping("/{id}/investigation")
    public Problem investigation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        String status = body.get("status");

        if (status != null
                && !List.of("INVESTIGATION", "ROOT_CAUSE_IDENTIFIED")
                        .contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Status must be INVESTIGATION or ROOT_CAUSE_IDENTIFIED");
        }

        return service.analystUpdate(
                id,
                body.get("investigationNotes"),
                body.get("rootCause"),
                body.get("workaround"),
                body.get("knownError"),
                status);
    }

    /**
     * Records technical resolution notes and marks solution progress.
     *
     * <p><b>Purpose:</b> Technical support engineer resolution workflow.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#engineerUpdate(Long, String, String, String)}.
     *
     * @param id Problem ID.
     * @param body JSON map with technicalNotes, resolution, status.
     * @param a Authentication principal.
     * @return Updated Problem.
     */
    @PutMapping("/{id}/technical-work")
    public Problem technical(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        String status = body.get("status");

        if (status != null
                && !List.of("SOLUTION_IN_PROGRESS", "RESOLVED")
                        .contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Status must be SOLUTION_IN_PROGRESS or RESOLVED");
        }

        return service.engineerUpdate(
                id,
                body.get("technicalNotes"),
                body.get("resolution"),
                status);
    }

    /**
     * Updates the problem's lifecycle status.
     *
     * <p><b>Purpose:</b> Manages transitions across valid ITIL status values (OPEN, ASSIGNED, INVESTIGATION,
     * ROOT_CAUSE_IDENTIFIED, SOLUTION_IN_PROGRESS, RESOLVED, CLOSED).
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#managerStatus(Long, String)}.
     *
     * @param id Problem ID.
     * @param body JSON body containing "status".
     * @param a Authentication principal.
     * @return Updated Problem entity.
     */
    @PutMapping("/{id}/status")
    public Problem status(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        String s = body.get("status");

        if (s == null
                || !List.of("OPEN", "ASSIGNED", "INVESTIGATION",
                        "ROOT_CAUSE_IDENTIFIED", "SOLUTION_IN_PROGRESS",
                        "RESOLVED", "CLOSED")
                        .contains(s.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status");
        }

        return service.managerStatus(id, s);
    }

    /**
     * Deletes a problem record.
     *
     * <p><b>Purpose:</b> Administrative removal of problem records.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link ProblemService#deleteProblem(Long)}.
     *
     * @param id Problem ID.
     * @param a Authentication principal.
     * @return Confirmation message map.
     */
    @DeleteMapping("/{id}")
    public Map<String, String> delete(
            @PathVariable Long id,
            Authentication a) {

        service.deleteProblem(id);
        return Map.of("message", "Deleted problem " + id);
    }
}
