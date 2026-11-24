
package com.example.problem_service.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;

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

    private boolean has(Authentication a, String role) {
        return a.getAuthorities().stream()
                .anyMatch(x -> x.getAuthority().equals("ROLE_" + role));
    }

    private void require(Authentication a, String... roles) {
        for (String r : roles) {
            if (has(a, r)) {
                return;
            }
        }
        throw new AccessDeniedException(
                "You are not authorized to perform this action");
    }

    // CREATE PROBLEM - EMPLOYEE
    @PostMapping
    public Problem create(@Valid @RequestBody Problem p, Authentication a) {

        require(a, "EMPLOYEE");

        p.setCreatedBy(a.getName());
        p.setAssignedTo(null);
        p.setAssignedAnalyst(null);
        p.setAssignedEngineer(null);
        p.setStatus("OPEN");

        return service.createProblem(p);
    }

    // GET ALL PROBLEMS BASED ON ROLE
    @GetMapping
    public List<Problem> list(Authentication a) {

        if (has(a, "EMPLOYEE")) {
            return service.getProblemsByCreator(a.getName());
        }

        if (has(a, "PROBLEM_ANALYST")) {
            return service.getProblemsByAnalyst(a.getName());
        }

        if (has(a, "TECHNICAL_SUPPORT_ENGINEER")) {
            return service.getProblemsByEngineer(a.getName());
        }

        require(a, "PROBLEM_MANAGER", "ADMIN");
        return service.getAllProblems();
    }

    // GET SINGLE PROBLEM
    @GetMapping("/{id}")
    public Problem get(@PathVariable Long id, Authentication a) {

        Problem p = service.getProblemById(id);

        if (has(a, "EMPLOYEE")
                && !a.getName().equals(p.getCreatedBy())) {
            throw new AccessDeniedException(
                    "You cannot access another employee's problem");
        }

        if (has(a, "PROBLEM_ANALYST")
                && !a.getName().equals(p.getAssignedAnalyst())) {
            throw new AccessDeniedException(
                    "Problem is not assigned to you");
        }

        if (has(a, "TECHNICAL_SUPPORT_ENGINEER")
                && !a.getName().equals(p.getAssignedEngineer())) {
            throw new AccessDeniedException(
                    "Problem is not assigned to you");
        }

        require(a, "EMPLOYEE", "PROBLEM_MANAGER",
                "PROBLEM_ANALYST", "TECHNICAL_SUPPORT_ENGINEER", "ADMIN");

        return p;
    }

    // MANAGER - ASSIGN ANALYST / ENGINEER
    @PutMapping("/{id}/management")
    public Problem management(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        require(a, "PROBLEM_MANAGER", "ADMIN");

        return service.managerUpdate(
                id,
                body.get("category"),
                body.get("priority"),
                body.get("assignedAnalyst"),
                body.get("assignedEngineer"));
    }

    // ANALYST - INVESTIGATION
    @PutMapping("/{id}/investigation")
    public Problem investigation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        require(a, "PROBLEM_ANALYST");

        Problem p = service.getProblemById(id);

        if (!a.getName().equals(p.getAssignedAnalyst())) {
            throw new AccessDeniedException(
                    "Problem is not assigned to you");
        }

        String status = body.get("status");

        if (status != null
                && !List.of("INVESTIGATION", "ROOT_CAUSE_IDENTIFIED")
                        .contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Analyst status must be INVESTIGATION or ROOT_CAUSE_IDENTIFIED");
        }

        return service.analystUpdate(
                id,
                body.get("investigationNotes"),
                body.get("rootCause"),
                body.get("workaround"),
                body.get("knownError"),
                status);
    }

    // ENGINEER - TECHNICAL WORK
    @PutMapping("/{id}/technical-work")
    public Problem technical(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        require(a, "TECHNICAL_SUPPORT_ENGINEER");

        Problem p = service.getProblemById(id);

        if (!a.getName().equals(p.getAssignedEngineer())) {
            throw new AccessDeniedException(
                    "Problem is not assigned to you");
        }

        String status = body.get("status");

        if (status != null
                && !List.of("SOLUTION_IN_PROGRESS", "RESOLVED")
                        .contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Engineer status must be SOLUTION_IN_PROGRESS or RESOLVED");
        }

        return service.engineerUpdate(
                id,
                body.get("technicalNotes"),
                body.get("resolution"),
                status);
    }

    // MANAGER - UPDATE STATUS
    @PutMapping("/{id}/status")
    public Problem status(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication a) {

        require(a, "PROBLEM_MANAGER", "ADMIN");

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

    // ADMIN - DELETE PROBLEM
    @DeleteMapping("/{id}")
    public Map<String, String> delete(
            @PathVariable Long id,
            Authentication a) {

        require(a, "ADMIN");

        service.deleteProblem(id);

        return Map.of("message", "Deleted problem " + id);
    }
}
