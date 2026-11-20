package com.northstar.request.service;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class RequestSyncStatusService {
    private final ServiceRequestRepository requests; private final RequestHistoryRepository history;
    public RequestSyncStatusService(ServiceRequestRepository requests,RequestHistoryRepository history){this.requests=requests;this.history=history;}
    @Transactional public void published(String requestId){change(requestId,null);}
    @Transactional public void failed(String requestId){change(requestId,RequestStatus.SYNC_FAILED);}
    private void change(String requestId,RequestStatus forced){
        try {
            UUID id=UUID.fromString(requestId);
            var request=requests.findById(id).orElse(null); if(request==null)return;
            RequestStatus previous=request.getStatus();
            RequestStatus next=forced!=null?forced:(request.getApproverId()==null?RequestStatus.SUBMITTED:RequestStatus.PENDING_APPROVAL);
            if(previous==RequestStatus.REJECTED||previous==RequestStatus.APPROVED||previous==RequestStatus.IN_PROGRESS||previous==RequestStatus.COMPLETED)return;
            if(previous!=next){request.setStatus(next);history.save(new RequestHistoryEntity(id,"system","SYNC_STATUS",previous.name(),next.name(),null));}
        } catch(IllegalArgumentException ignored) { }
    }
}
