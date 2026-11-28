package com.northstar.request.outbox;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.integration.ServiceNowRequestClient;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ServiceNowOutageRetryTest {

    private ServiceRequestRepository repository;
    private RequestHistoryRepository history;
    private ServiceNowRequestClient client;
    private ObjectMapper mapper;
    private ServiceNowOutageRetryScheduler scheduler;

    @BeforeEach
    void setUp() {
        repository = mock(ServiceRequestRepository.class);
        history = mock(RequestHistoryRepository.class);
        client = mock(ServiceNowRequestClient.class);
        mapper = new ObjectMapper();
        scheduler = new ServiceNowOutageRetryScheduler(repository, history, client, mapper);
    }

    @Test
    void recoversSuccessfullyFromOutage() throws Exception {
        ServiceRequestEntity entity = new ServiceRequestEntity("idemp-1", "Asset purchase", "Laptop", "alice", "alice", "manager",
                mapper.writeValueAsString(Map.of("syncStatus", "PENDING_RETRY", "syncAttempts", "1", "item", "Laptop")));

        when(client.createRequest(any())).thenReturn(Map.of(
                "number", "REQ0010099",
                "sys_id", "sn_sys_99",
                "request_number", "REQ0010099",
                "ritm_number", "RITM0010099"
        ));

        scheduler.processSingleRequest(entity, Instant.now());

        assertEquals("REQ0010099", entity.getServiceNowNumber());
        assertEquals("sn_sys_99", entity.getExternalId());
        assertEquals("servicenow", entity.getExternalSystem());

        Map<?, ?> fields = mapper.readValue(entity.getFieldsJson(), Map.class);
        assertEquals("SYNCED", fields.get("syncStatus"));
        assertNull(fields.get("syncError"));

        verify(repository).save(entity);
        ArgumentCaptor<RequestHistoryEntity> captor = ArgumentCaptor.forClass(RequestHistoryEntity.class);
        verify(history).save(captor.capture());
        assertEquals("SERVICENOW_OUTAGE_RETRY_SUCCESS", captor.getValue().getAction());
    }

    @Test
    void marksFailedWhenMaxRetriesExceeded() throws Exception {
        ServiceRequestEntity entity = new ServiceRequestEntity("idemp-2", "Asset purchase", "Laptop", "alice", "alice", "manager",
                mapper.writeValueAsString(Map.of("syncStatus", "PENDING_RETRY", "syncAttempts", "5", "item", "Laptop")));

        scheduler.processSingleRequest(entity, Instant.now());

        Map<?, ?> fields = mapper.readValue(entity.getFieldsJson(), Map.class);
        assertEquals("FAILED", fields.get("syncStatus"));
        assertTrue(String.valueOf(fields.get("syncError")).contains("Exceeded max retry limit"));

        verify(repository).save(entity);
        ArgumentCaptor<RequestHistoryEntity> captor = ArgumentCaptor.forClass(RequestHistoryEntity.class);
        verify(history).save(captor.capture());
        assertEquals("SERVICENOW_SYNC_MAX_RETRIES", captor.getValue().getAction());
    }

    @Test
    void appliesExponentialBackoffOnTransientFailure() throws Exception {
        ServiceRequestEntity entity = new ServiceRequestEntity("idemp-3", "Asset purchase", "Laptop", "alice", "alice", "manager",
                mapper.writeValueAsString(Map.of("syncStatus", "PENDING_RETRY", "syncAttempts", "2", "item", "Laptop")));

        when(client.createRequest(any())).thenThrow(new RuntimeException("Connection timed out to ServiceNow Cloud"));

        scheduler.processSingleRequest(entity, Instant.now());

        Map<?, ?> fields = mapper.readValue(entity.getFieldsJson(), Map.class);
        assertEquals("PENDING_RETRY", fields.get("syncStatus"));
        assertEquals("3", fields.get("syncAttempts"));
        assertNotNull(fields.get("nextSyncAttemptAt"));

        verify(repository).save(entity);
        ArgumentCaptor<RequestHistoryEntity> captor = ArgumentCaptor.forClass(RequestHistoryEntity.class);
        verify(history).save(captor.capture());
        assertEquals("SERVICENOW_OUTAGE_RETRY_ATTEMPT", captor.getValue().getAction());
    }
}
