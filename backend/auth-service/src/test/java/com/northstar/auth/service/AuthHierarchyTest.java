package com.northstar.auth.service;

import com.northstar.auth.dto.AuthModels.AccessAssignment;
import com.northstar.auth.dto.AuthModels.SubordinateSummary;
import com.northstar.auth.dto.AuthModels.UserSummary;
import com.northstar.auth.entity.EmployeeDepartment;
import com.northstar.auth.entity.OrganizationalGroup;
import com.northstar.auth.entity.PortalRole;
import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.repository.PortalUserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthHierarchyTest {

    @Mock
    private PortalUserRepository users;

    @Mock
    private PasswordEncoder passwords;

    @Mock
    private JwtEncoder jwtEncoder;

    @Mock
    private com.northstar.auth.integration.ServiceNowUserSyncClient serviceNowSyncClient;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(users, passwords, jwtEncoder, serviceNowSyncClient, "test-issuer", "test-audience", 60);
    }

    @Test
    void testReportingHierarchyTraversal() {
        UUID adminId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        UUID empId = UUID.randomUUID();

        PortalUser manager = new PortalUser("EMP-00001", "sarah.jenkins", "Sarah Jenkins", "sarah@company.com", "hash", PortalRole.MANAGER_ADMIN, true);
        setField(manager, "id", managerId);
        manager.setOrgGroup(OrganizationalGroup.COMPANY_INFRASTRUCTURE);

        PortalUser lead = new PortalUser("EMP-00002", "alex.rivera", "Alex Rivera", "alex@company.com", "hash", PortalRole.MANAGER, true);
        setField(lead, "id", leadId);
        lead.setManagerId(managerId);
        lead.setManagerName("Sarah Jenkins");
        lead.setOrgGroup(OrganizationalGroup.COMPANY_INFRASTRUCTURE);

        PortalUser emp = new PortalUser("EMP-00003", "david.kim", "David Kim", "david@company.com", "hash", PortalRole.EMPLOYEE, true);
        setField(emp, "id", empId);
        emp.setManagerId(leadId);
        emp.setManagerName("Alex Rivera");
        emp.setOrgGroup(OrganizationalGroup.COMPANY_INFRASTRUCTURE);

        when(users.findById(managerId)).thenReturn(Optional.of(manager));
        when(users.findAll()).thenReturn(List.of(manager, lead, emp));

        List<SubordinateSummary> hierarchy = authService.getReportingHierarchy(managerId);
        assertEquals(2, hierarchy.size(), "Manager should have 2 subordinates in reporting hierarchy");
        assertTrue(hierarchy.stream().anyMatch(s -> s.id().equals(leadId)));
        assertTrue(hierarchy.stream().anyMatch(s -> s.id().equals(empId)));

        List<UUID> subordinateIds = authService.getSubordinateIds(managerId);
        assertTrue(subordinateIds.contains(leadId));
        assertTrue(subordinateIds.contains(empId));
    }

    @Test
    void testSelfManagerAssignmentThrowsBadRequest() {
        UUID empId = UUID.randomUUID();
        PortalUser emp = new PortalUser("EMP-00004", "john.doe", "John Doe", "john@company.com", "hash", PortalRole.EMPLOYEE, true);
        setField(emp, "id", empId);
        emp.setDepartment(EmployeeDepartment.SOFTWARE_ENGINEERING);

        when(users.findById(empId)).thenReturn(Optional.of(emp));

        AccessAssignment assignment = new AccessAssignment(
                PortalRole.EMPLOYEE,
                EmployeeDepartment.SOFTWARE_ENGINEERING,
                empId, // Self-assignment!
                OrganizationalGroup.GENERAL);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.assignAccess(empId, assignment, UUID.randomUUID())
        );
        assertTrue(ex.getMessage().contains("An employee cannot be assigned as their own manager"));
    }

    @Test
    void testCircularReportingHierarchyDetectionThrowsBadRequest() {
        UUID userAId = UUID.randomUUID();
        UUID userBId = UUID.randomUUID();

        PortalUser userA = new PortalUser("EMP-00005", "user.a", "User A", "a@company.com", "hash", PortalRole.MANAGER, true);
        setField(userA, "id", userAId);
        userA.setDepartment(EmployeeDepartment.IT);

        PortalUser userB = new PortalUser("EMP-00006", "user.b", "User B", "b@company.com", "hash", PortalRole.MANAGER, true);
        setField(userB, "id", userBId);
        userB.setDepartment(EmployeeDepartment.IT);
        // User B currently reports to User A
        userB.setManagerId(userAId);

        when(users.findById(userAId)).thenReturn(Optional.of(userA));
        when(users.findById(userBId)).thenReturn(Optional.of(userB));

        // Attempt to assign User B as manager of User A (creating A -> B -> A cycle)
        AccessAssignment assignment = new AccessAssignment(
                PortalRole.MANAGER,
                EmployeeDepartment.IT,
                userBId,
                OrganizationalGroup.CORPORATE);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.assignAccess(userAId, assignment, UUID.randomUUID())
        );
        assertTrue(ex.getMessage().contains("Circular reporting hierarchy detected"));
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
