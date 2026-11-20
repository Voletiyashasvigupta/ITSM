package com.northstar.request.service;

import com.northstar.request.entity.RequestStatus;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RequestStateMachine {
    private static final Map<RequestStatus,Set<RequestStatus>> ALLOWED=Map.of(
        RequestStatus.DRAFT,Set.of(RequestStatus.SUBMITTED),
        RequestStatus.SUBMITTED,Set.of(RequestStatus.PENDING_APPROVAL,RequestStatus.APPROVED,RequestStatus.REJECTED,RequestStatus.IN_PROGRESS,RequestStatus.COMPLETED,RequestStatus.SYNC_FAILED),
        RequestStatus.PENDING_APPROVAL,Set.of(RequestStatus.APPROVED,RequestStatus.REJECTED,RequestStatus.SYNC_FAILED),
        RequestStatus.APPROVED,Set.of(RequestStatus.IN_PROGRESS,RequestStatus.SYNC_FAILED),
        RequestStatus.IN_PROGRESS,Set.of(RequestStatus.COMPLETED,RequestStatus.SYNC_FAILED),
        RequestStatus.SYNC_FAILED,Set.of(RequestStatus.SUBMITTED,RequestStatus.PENDING_APPROVAL,RequestStatus.APPROVED,RequestStatus.REJECTED));
    public boolean allows(RequestStatus from,RequestStatus to){return ALLOWED.getOrDefault(from,Set.of()).contains(to);}
    public void require(RequestStatus from,RequestStatus to){if(!allows(from,to))throw new ResponseStatusException(HttpStatus.CONFLICT,"Illegal request status transition: "+from+" -> "+to);}
}
