package com.northstar.request.service;

import com.northstar.request.entity.ApprovalEntity;
import com.northstar.request.entity.RequestHistoryEntity;
import com.northstar.request.entity.RequestStatus;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.dto.ApprovalResponse;
import com.northstar.request.repository.ApprovalRepository;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

public interface LocalApprovalService {
    java.util.List<ApprovalResponse> pending(String actor, boolean manager);
    java.util.List<ApprovalResponse> history(String actor, boolean manager);
    ApprovalResponse get(UUID id, String actor, boolean manager);
    ApprovalResponse decide(UUID id, String actor, boolean approve, String comment);
}

@Service
class LocalApprovalServiceImpl implements LocalApprovalService {
    private final ApprovalRepository approvals; private final ServiceRequestRepository requests; private final RequestHistoryRepository history;
    private final RequestStateMachine stateMachine;
    LocalApprovalServiceImpl(ApprovalRepository a,ServiceRequestRepository r,RequestHistoryRepository h,RequestStateMachine stateMachine){approvals=a;requests=r;history=h;this.stateMachine=stateMachine;}
    @Override public java.util.List<ApprovalResponse> pending(String actor,boolean manager){return list(actor,manager,true);}
    @Override public java.util.List<ApprovalResponse> history(String actor,boolean manager){return list(actor,manager,false);}
    @Override public ApprovalResponse get(UUID id, String actor, boolean manager) {
        ApprovalEntity a = approvals.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found"));
        ServiceRequestEntity r = requests.findById(a.getRequestId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        boolean participant = a.getApproverId().equals(actor) || r.getRequesterId().equals(actor) || r.getRequestedForId().equals(actor);
        if (!manager && !participant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to approval record");
        return view(a);
    }
    private java.util.List<ApprovalResponse> list(String actor,boolean manager,boolean pending){
        var rows=pending?approvals.findByApproverIdAndDecisionOrderByCreatedAtDesc(actor,"PENDING"):approvals.findByApproverIdOrderByCreatedAtDesc(actor);
        return rows.stream().filter(a->!pending||a.getDecision().equals("PENDING")).map(this::view).toList();
    }
    @Override @Transactional public ApprovalResponse decide(UUID id,String actor,boolean approve,String comment){
        ApprovalEntity a=approvals.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Approval not found"));
        if(!a.getApproverId().equals(actor))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only the assigned approver can decide");
        if(!"PENDING".equals(a.getDecision()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Approval has already been decided");
        if(!approve&&(comment==null||comment.isBlank()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A comment is required when rejecting");
        ServiceRequestEntity r=requests.findById(a.getRequestId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Request not found"));
        RequestStatus target=approve?RequestStatus.APPROVED:RequestStatus.REJECTED, from=r.getStatus();
        stateMachine.require(from,target);
        a.decide(approve?"APPROVED":"REJECTED",comment==null?null:comment.trim());r.setStatus(target);
        history.save(new RequestHistoryEntity(r.getId(),actor,approve?"APPROVED":"REJECTED",from.name(),target.name(),comment));return view(a);
    }
    private ApprovalResponse view(ApprovalEntity a){ServiceRequestEntity r=requests.findById(a.getRequestId()).orElseThrow();return new ApprovalResponse(a.getId(),r.getId(),r.getRequestNumber(),r.getServiceName(),r.getRequesterId(),a.getApproverId(),a.getDecision(),a.getComment(),a.getCreatedAt(),a.getDecidedAt());}
}
