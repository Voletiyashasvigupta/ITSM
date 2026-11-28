package com.northstar.auth.controller;

import com.northstar.auth.dto.AuthModels.SubordinateSummary;
import com.northstar.auth.dto.AuthModels.UserSummary;
import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.service.AuthService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal REST controller for microservice-to-microservice communication.
 *
 * <p><b>Purpose:</b> Allows downstream microservices (such as {@code request-service}) to query
 * user identity metadata and reporting hierarchy directly over the internal container network.
 */
@RestController
@RequestMapping("/api/auth/internal")
public class InternalAuthController {
    private final AuthService auth;

    public InternalAuthController(AuthService auth) {
        this.auth = auth;
    }

    /**
     * Retrieves sanitized summary metadata for an employee by UUID.
     */
    @GetMapping("/users/{id}")
    public UserSummary getUser(@PathVariable("id") UUID id) {
        PortalUser user = auth.findUser(id);
        return new UserSummary(
                user.getId(),
                user.getEmployeeId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getManagerId(),
                user.getManagerName(),
                user.getOrgGroup(),
                user.isActive(),
                user.getCreatedAt());
    }

    /**
     * Returns the list of subordinate user IDs in the reporting hierarchy of the given manager.
     */
    @GetMapping("/users/{id}/subordinate-ids")
    public List<String> getSubordinateIds(@PathVariable("id") UUID id) {
        return auth.getSubordinateIds(id).stream().map(UUID::toString).toList();
    }

    /**
     * Returns full subordinate summaries in the reporting hierarchy of the given manager.
     */
    @GetMapping("/users/{id}/subordinates")
    public List<SubordinateSummary> getSubordinates(@PathVariable("id") UUID id) {
        return auth.getReportingHierarchy(id);
    }
}
