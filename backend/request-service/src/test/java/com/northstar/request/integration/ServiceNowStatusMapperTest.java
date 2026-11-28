package com.northstar.request.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import com.northstar.request.entity.RequestStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ServiceNowStatusMapperTest {

    private ServiceNowStatusMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ServiceNowStatusMapper();
    }

    @Test
    void mapsRejectionCorrectly() {
        assertEquals(RequestStatus.REJECTED,
                mapper.mapToLocalStatus("rejected", "1", "waiting_for_approval", RequestStatus.PENDING_APPROVAL));
        assertEquals(RequestStatus.REJECTED,
                mapper.mapToLocalStatus("requested", "4", "closed_incomplete", RequestStatus.PENDING_APPROVAL));
    }

    @Test
    void mapsCancellationCorrectly() {
        assertEquals(RequestStatus.CANCELLED,
                mapper.mapToLocalStatus("not_requested", "7", "closed_skipped", RequestStatus.PENDING_APPROVAL));
        assertEquals(RequestStatus.CANCELLED,
                mapper.mapToLocalStatus("not_requested", "8", "closed_cancelled", RequestStatus.PENDING_APPROVAL));
        assertEquals(RequestStatus.CANCELLED,
                mapper.mapToLocalStatus("requested", "1", "cancelled", RequestStatus.PENDING_APPROVAL));
    }

    @Test
    void mapsCompletionCorrectly() {
        assertEquals(RequestStatus.COMPLETED,
                mapper.mapToLocalStatus("approved", "3", "complete", RequestStatus.IN_PROGRESS));
        assertEquals(RequestStatus.COMPLETED,
                mapper.mapToLocalStatus("approved", "3", "closed_complete", RequestStatus.APPROVED));
    }

    @Test
    void mapsFulfillmentAndDeliveryToInProgress() {
        assertEquals(RequestStatus.IN_PROGRESS,
                mapper.mapToLocalStatus("approved", "2", "fulfillment", RequestStatus.APPROVED));
        assertEquals(RequestStatus.IN_PROGRESS,
                mapper.mapToLocalStatus("approved", "2", "delivery", RequestStatus.APPROVED));
    }

    @Test
    void mapsApprovalCorrectly() {
        assertEquals(RequestStatus.APPROVED,
                mapper.mapToLocalStatus("approved", "1", "waiting_for_approval", RequestStatus.PENDING_APPROVAL));
    }

    @Test
    void mapsPendingApprovalCorrectly() {
        assertEquals(RequestStatus.PENDING_APPROVAL,
                mapper.mapToLocalStatus("requested", "1", "waiting_for_approval", RequestStatus.SUBMITTED));
    }
}
