package com.northstar.request.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.northstar.request.client.AuthServiceClient;
import com.northstar.request.dto.ApprovalResponse;
import com.northstar.request.entity.ApprovalEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.integration.ServiceNowRequestClient;
import com.northstar.request.repository.ApprovalRepository;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LocalApprovalHierarchyTest {

    @Mock
    private ApprovalRepository approvals;

    @Mock
    private ServiceRequestRepository requests;

    @Mock
    private RequestHistoryRepository history;

    @Mock
    private ServiceNowRequestClient serviceNowClient;

    @Mock
    private AuthServiceClient authClient;

    private LocalApprovalService approvalService;

    @BeforeEach
    void setUp() {
        approvalService = new LocalApprovalServiceImpl(
                approvals, requests, history, new RequestStateMachine(), serviceNowClient, authClient);
    }

    @Test
    void managerCanApproveForEmployeeInReportingHierarchy() {
        UUID approvalId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        String managerId = "mgr-alex";
        String subordinateId = "emp-david";

        // Approval was routed to unassigned admin or delegate, but Alex is the reporting manager
        ApprovalEntity approval = new ApprovalEntity(requestId, "delegated-or-admin");
        ServiceRequestEntity request = mock(ServiceRequestEntity.class);
        when(request.getId()).thenReturn(requestId);
        when(request.getRequestNumber()).thenReturn("NSR-100");
        when(request.getServiceName()).thenReturn("Access and accounts");
        when(request.getRequesterId()).thenReturn(subordinateId);
        when(request.getRequestedForId()).thenReturn(subordinateId);
        when(request.getStatus()).thenReturn(RequestStatus.PENDING_APPROVAL);

        when(approvals.findById(approvalId)).thenReturn(Optional.of(approval));
        when(requests.findById(requestId)).thenReturn(Optional.of(request));
        when(authClient.isSubordinate(managerId, subordinateId)).thenReturn(true);

        ApprovalResponse response = approvalService.decide(approvalId, managerId, false, true, "Approved for team member");
        assertNotNull(response);
        assertEquals("APPROVED", response.decision());
        verify(history).save(any());
    }

    @Test
    void managerCannotApproveForEmployeeOutsideHierarchy() {
        UUID approvalId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        String managerA = "mgr-alex";
        String otherManager = "mgr-other";
        String otherEmployee = "emp-stranger";

        ApprovalEntity approval = new ApprovalEntity(requestId, otherManager);
        ServiceRequestEntity request = mock(ServiceRequestEntity.class);
        when(request.getRequestedForId()).thenReturn(otherEmployee);
        when(request.getRequesterId()).thenReturn(otherEmployee);

        when(approvals.findById(approvalId)).thenReturn(Optional.of(approval));
        when(requests.findById(requestId)).thenReturn(Optional.of(request));
        when(authClient.isSubordinate(managerA, otherEmployee)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                approvalService.decide(approvalId, managerA, false, true, "Unauthorized approval attempt")
        );
        assertTrue(ex.getMessage().contains("Manager can only approve requests for employees within their assigned reporting hierarchy"));
    }

    @Test
    void administratorCanApproveAnyRequest() {
        UUID approvalId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        String adminId = "admin-sarah";
        String otherEmployee = "emp-anyone";

        ApprovalEntity approval = new ApprovalEntity(requestId, "unassigned");
        ServiceRequestEntity request = mock(ServiceRequestEntity.class);
        when(request.getId()).thenReturn(requestId);
        when(request.getRequestNumber()).thenReturn("NSR-200");
        when(request.getServiceName()).thenReturn("Workplace services");
        when(request.getRequesterId()).thenReturn(otherEmployee);
        when(request.getStatus()).thenReturn(RequestStatus.PENDING_APPROVAL);

        when(approvals.findById(approvalId)).thenReturn(Optional.of(approval));
        when(requests.findById(requestId)).thenReturn(Optional.of(request));

        ApprovalResponse response = approvalService.decide(approvalId, adminId, true, true, "Admin executive override");
        assertNotNull(response);
        assertEquals("APPROVED", response.decision());
    }

    @Test
    void rejectionRequiresComment() {
        UUID approvalId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        String managerId = "mgr-alex";

        ApprovalEntity approval = new ApprovalEntity(requestId, managerId);
        ServiceRequestEntity request = mock(ServiceRequestEntity.class);
        when(request.getRequestedForId()).thenReturn("emp-david");
        when(request.getRequesterId()).thenReturn("emp-david");

        when(approvals.findById(approvalId)).thenReturn(Optional.of(approval));
        when(requests.findById(requestId)).thenReturn(Optional.of(request));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                approvalService.decide(approvalId, managerId, false, false, "   ")
        );
        assertTrue(ex.getMessage().contains("A comment is required when rejecting"));
    }
}
