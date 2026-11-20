package com.northstar.request.service;

import static org.junit.jupiter.api.Assertions.*;
import com.northstar.request.entity.RequestStatus;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class RequestStateMachineTest {
    private final RequestStateMachine machine=new RequestStateMachine();
    @Test void permitsExpectedApprovalAndFulfillmentTransitions(){
        assertTrue(machine.allows(RequestStatus.PENDING_APPROVAL,RequestStatus.APPROVED));
        assertTrue(machine.allows(RequestStatus.APPROVED,RequestStatus.IN_PROGRESS));
        assertTrue(machine.allows(RequestStatus.IN_PROGRESS,RequestStatus.COMPLETED));
        assertTrue(machine.allows(RequestStatus.SYNC_FAILED,RequestStatus.SUBMITTED));
        assertTrue(machine.allows(RequestStatus.SYNC_FAILED,RequestStatus.APPROVED));
        assertTrue(machine.allows(RequestStatus.SYNC_FAILED,RequestStatus.REJECTED));
    }
    @Test void rejectsIllegalTerminalTransition(){
        assertFalse(machine.allows(RequestStatus.REJECTED,RequestStatus.APPROVED));
        assertThrows(ResponseStatusException.class,()->machine.require(RequestStatus.COMPLETED,RequestStatus.IN_PROGRESS));
    }
}
