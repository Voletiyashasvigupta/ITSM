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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

class AssetPurchaseSubmissionTest {

    private ServiceRequestRepository repository;
    private RequestSubmissionWriter writer;
    private AuthServiceClient authClient;
    private RequestSubmissionService service;

    @BeforeEach
    void setUp() {
        repository = mock(ServiceRequestRepository.class);
        writer = mock(RequestSubmissionWriter.class);
        authClient = mock(AuthServiceClient.class);
        service = new RequestSubmissionService(repository, writer, authClient);
    }

    @Test
    void rejectsAssetPurchaseMissingModelOrJustification() {
        assertThrows(ResponseStatusException.class, () ->
                service.submit("idemp-ap-1", "alice", List.of("EMPLOYEE"), null,
                        new RequestSubmission("Asset purchase", "New Laptop", null, "manager-1",
                                Map.of("assetType", "Laptop / Workstation"))));
    }

    @Test
    void requiresExpeditedJustificationWhenExpeditedPriorityRequested() {
        assertThrows(ResponseStatusException.class, () ->
                service.submit("idemp-ap-2", "alice", List.of("EMPLOYEE"), null,
                        new RequestSubmission("Asset purchase", "Urgent Server", null, "manager-1",
                                Map.of(
                                        "assetType", "Server & Storage",
                                        "assetModel", "Dell PowerEdge R760",
                                        "reason", "Production database upgrade",
                                        "isExpedited", "true"
                                        // missing expeditedJustification
                                ))));
    }

    @Test
    void acceptsCompleteAssetPurchaseWithAllFieldsAndConditionalJustification() {
        when(writer.create(anyString(), anyString(), any())).thenReturn(
                new RequestSubmissionResponse(UUID.randomUUID(), "REQ0010042", "Asset purchase", "alice", "alice",
                        RequestStatus.PENDING_APPROVAL, "REQ0010042", Instant.now()));

        RequestSubmission input = new RequestSubmission("Asset purchase", "MacBook Pro Purchase", null, "manager-1",
                Map.ofEntries(
                        Map.entry("assetType", "Laptop / Workstation"),
                        Map.entry("assetModel", "Apple MacBook Pro 16 M3 Max / 64GB"),
                        Map.entry("quantity", "2"),
                        Map.entry("estimatedBudget", "7000"),
                        Map.entry("costCenter", "Engineering - CC-402"),
                        Map.entry("deliveryLocation", "Building 4, Floor 2"),
                        Map.entry("deliveryContact", "Alice Smith (+1 555-0199)"),
                        Map.entry("neededBy", "2026-12-15"),
                        Map.entry("reason", "Heavy local AI model compilation and development"),
                        Map.entry("isExpedited", "true"),
                        Map.entry("expeditedJustification", "Current machine suffered hardware failure blocking release")
                ));

        RequestSubmissionResponse response = service.submit("idemp-ap-3", "alice", List.of("EMPLOYEE"), null, input);
        assertNotNull(response);
        assertEquals("REQ0010042", response.requestNumber());

        ArgumentCaptor<RequestSubmission> captor = ArgumentCaptor.forClass(RequestSubmission.class);
        verify(writer).create(eq("idemp-ap-3"), eq("alice"), captor.capture());
        assertEquals("2", captor.getValue().fields().get("quantity"));
        assertEquals("Engineering - CC-402", captor.getValue().fields().get("costCenter"));
    }
}
