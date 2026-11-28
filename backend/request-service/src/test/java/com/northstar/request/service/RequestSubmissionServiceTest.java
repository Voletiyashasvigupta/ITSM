package com.northstar.request.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.northstar.request.client.AuthServiceClient;
import com.northstar.request.dto.RequestSubmission;
import com.northstar.request.dto.RequestSubmissionResponse;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

class RequestSubmissionServiceTest {
    @Test
    void employeeCannotSubmitOnBehalfEvenIfBodyContainsAnotherIdentity() {
        ServiceRequestRepository requests = mock(ServiceRequestRepository.class);
        RequestSubmissionWriter writer = mock(RequestSubmissionWriter.class);
        AuthServiceClient authClient = mock(AuthServiceClient.class);
        when(writer.create(anyString(), anyString(), any())).thenReturn(
                new RequestSubmissionResponse(UUID.randomUUID(), "NSR-1", "Request a device", "hari", "hari", RequestStatus.PENDING_APPROVAL, null, Instant.now()));
        RequestSubmissionService service = new RequestSubmissionService(requests, writer, authClient);
        service.submit("key", "hari", List.of("EMPLOYEE"), null,
                new RequestSubmission("Request a device", "Laptop request", "other", "manager",
                        Map.of("item", "Laptop", "workStyle", "Hybrid", "location", "Office", "neededBy", "2026-12-01", "reason", "Work")));
        ArgumentCaptor<RequestSubmission> captured = ArgumentCaptor.forClass(RequestSubmission.class);
        verify(writer).create(eq("key"), eq("hari"), captured.capture());
        assertEquals("hari", captured.getValue().requestedForId());
    }

    @Test
    void conditionalRequiredFieldsAreValidatedServerSide() {
        ServiceRequestRepository requests = mock(ServiceRequestRepository.class);
        RequestSubmissionWriter writer = mock(RequestSubmissionWriter.class);
        AuthServiceClient authClient = mock(AuthServiceClient.class);
        RequestSubmissionService service = new RequestSubmissionService(requests, writer, authClient);
        assertThrows(ResponseStatusException.class, () ->
                service.submit("key", "hari", List.of("EMPLOYEE"), null,
                        new RequestSubmission("Request a device", "Laptop request", null, "manager", Map.of("item", "Laptop"))));
        verifyNoInteractions(writer);
    }

    @Test
    void autoRoutesToPersonalManagerWhenApproverOmitted() {
        ServiceRequestRepository requests = mock(ServiceRequestRepository.class);
        RequestSubmissionWriter writer = mock(RequestSubmissionWriter.class);
        AuthServiceClient authClient = mock(AuthServiceClient.class);
        when(authClient.getPersonalManagerId("david")).thenReturn("alex-manager-id");
        when(writer.create(anyString(), anyString(), any())).thenReturn(
                new RequestSubmissionResponse(UUID.randomUUID(), "NSR-2", "Request a device", "david", "david", RequestStatus.PENDING_APPROVAL, null, Instant.now()));

        RequestSubmissionService service = new RequestSubmissionService(requests, writer, authClient);
        service.submit("key-mgr", "david", List.of("EMPLOYEE"), null,
                new RequestSubmission("Request a device", "Laptop request", null, null,
                        Map.of("item", "Laptop", "neededBy", "2026-12-01", "reason", "Engineering work")));

        ArgumentCaptor<RequestSubmission> captured = ArgumentCaptor.forClass(RequestSubmission.class);
        verify(writer).create(eq("key-mgr"), eq("david"), captured.capture());
        assertEquals("alex-manager-id", captured.getValue().approverId());
    }

    @Test
    void safeFallbackToAdminTriageWhenNoManagerAssigned() {
        ServiceRequestRepository requests = mock(ServiceRequestRepository.class);
        RequestSubmissionWriter writer = mock(RequestSubmissionWriter.class);
        AuthServiceClient authClient = mock(AuthServiceClient.class);
        when(authClient.getPersonalManagerId("newuser")).thenReturn(null);
        when(writer.create(anyString(), anyString(), any())).thenReturn(
                new RequestSubmissionResponse(UUID.randomUUID(), "NSR-3", "Request a device", "newuser", "newuser", RequestStatus.PENDING_APPROVAL, null, Instant.now()));

        RequestSubmissionService service = new RequestSubmissionService(requests, writer, authClient);
        service.submit("key-fallback", "newuser", List.of("EMPLOYEE"), null,
                new RequestSubmission("Request a device", "Display monitor", null, null,
                        Map.of("item", "Monitor", "neededBy", "2026-12-01", "reason", "Remote work")));

        ArgumentCaptor<RequestSubmission> captured = ArgumentCaptor.forClass(RequestSubmission.class);
        verify(writer).create(eq("key-fallback"), eq("newuser"), captured.capture());
        assertEquals("ADMIN_TRIAGE", captured.getValue().approverId());
    }
}
