package com.example.problem_service.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;

import com.example.problem_service.service.ProblemService;
import com.example.problem_service.entity.Problem;

import java.util.*;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    private final ProblemService service;

    public ProblemController(ProblemService service) {
        this.service = service;
    }

    // CREATE PROBLEM - ACCESSIBLE TO ALL AUTHENTICATED USERS (EMPLOYEE, ANALYST, ADMIN)
    @PostMapping
    public Problem create(@Valid @RequestBody Problem p, Authentication a) {
        p.setCreatedBy(a.getName());
        if (p.getStatus() == null || p.getStatus().isBlank()) {
            p.setStatus("OPEN");
        }
        return service.createProblem(p);
    }

    // GET ALL PROBLEMS - ACCESSIBLE TO ALL USERS (EMPLOYEES & ANALYSTS VIEW ALL SYSTEM PROBLEMS)
    @GetMapping
    public List<Problem> list(Authentication a) {
        return service.getAllProblems();
    }

    // GET SINGLE PROBLEM
    @GetMapping("/{id}")
    public Problem get(@PathVariable Long id, Authentication a) {
        return service.getProblemById(id);
    }

    // MANAGEMENT - ASSIGN ANALYST / ENGINEER / CATEGORY / PRIORITY
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

    // INVESTIGATION & ROOT CAUSE ANALYSIS
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

    // TECHNICAL WORK & RESOLUTION
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

    // UPDATE LIFECYCLE STATUS
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

    // DELETE PROBLEM - ADMIN ONLY
    @DeleteMapping("/{id}")
    public Map<String, String> delete(
            @PathVariable Long id,
            Authentication a) {

        service.deleteProblem(id);
        return Map.of("message", "Deleted problem " + id);
    }
}
