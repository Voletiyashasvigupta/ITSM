package com.itsm.changemanagement.service;
import com.itsm.changemanagement.entity.*;
import com.itsm.changemanagement.repository.*;
import com.itsm.changemanagement.exception.ApiExceptions;
import com.itsm.changemanagement.integration.ServiceNowChangeClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import java.time.*;
import java.util.*;

/**
 * Core business service implementing ITIL Change Enablement lifecycles.
 *
 * <p><b>Purpose:</b> Enforces the state machine for Change Requests (Draft, Submitted, Assessment, Under Review,
 * Pending Approval, Approved, Scheduled, In Progress, Implemented, Validated, Closed, Rolled Back).
 * Manages RFC intake, risk assessments, CAB reviews, approvals, implementation progress tracking, rollbacks,
 * and immutable change history audit logging.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.itsm.changemanagement.controller.ChangeController}.
 * Interacts with {@link ChangeRequestRepository} and {@link ChangeHistoryRepository}.
 */
@Service
public class ChangeService {
    private final ChangeRequestRepository repo;
    private final ChangeHistoryRepository history;
    private final ServiceNowChangeClient serviceNowClient;

    public ChangeService(ChangeRequestRepository r, ChangeHistoryRepository h, ServiceNowChangeClient s) {
        repo = r;
        history = h;
        serviceNowClient = s;
    }

    public ChangeRequest get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ApiExceptions.NotFound("Change not found: " + id));
    }

    @Transactional
    public ChangeRequest create(Map<String, Object> m) {
        ChangeRequest c = new ChangeRequest();
        apply(c, m, true);
        c.setChangeNumber("TMP-" + UUID.randomUUID().toString().substring(0, 20));
        c.setStatus(ChangeStatus.DRAFT);
        ChangeRequest saved = repo.save(c);

        String chgNum = "CHG-" + String.format("%05d", saved.getId());
        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", saved.getShortDescription());
            snPayload.put("description", saved.getDetailedDescription());
            snPayload.put("justification", saved.getBusinessJustification());
            snPayload.put("category", saved.getCategory() != null ? saved.getCategory().name() : "Other");
            Map<String, Object> snResponse = serviceNowClient.createChange(snPayload);
            if (snResponse != null && snResponse.get("number") != null) {
                chgNum = String.valueOf(snResponse.get("number"));
            }
        } catch (Exception ignored) {
            // Graceful fallback to local CHG numbering
        }

        saved.setChangeNumber(chgNum);
        saved = repo.save(saved);
        log(saved, null, "DRAFT", "CREATED", str(m, "requestedBy"), "Change request created");
        return saved;
    }
 private String str(Map<String,Object> m,String k){Object v=m.get(k);return v==null?null:String.valueOf(v);}private void apply(ChangeRequest c,Map<String,Object> m,boolean required){set(m,"shortDescription",c::setShortDescription);set(m,"detailedDescription",c::setDetailedDescription);set(m,"requestedBy",c::setRequestedBy);set(m,"requesterEmail",c::setRequesterEmail);set(m,"department",c::setDepartment);set(m,"impact",c::setImpact);set(m,"affectedCi",c::setAffectedCi);set(m,"businessJustification",c::setBusinessJustification);set(m,"implementationPlan",c::setImplementationPlan);set(m,"rollbackPlan",c::setRollbackPlan);set(m,"testPlan",c::setTestPlan);set(m,"riskDescription",c::setRiskDescription);set(m,"businessImpact",c::setBusinessImpact);set(m,"technicalImpact",c::setTechnicalImpact);set(m,"riskMitigationPlan",c::setRiskMitigationPlan);    if(m.get("changeType")!=null)c.setChangeType(ChangeType.valueOf(str(m,"changeType").toUpperCase()));
    if(m.get("category")!=null)c.setCategory(ChangeCategory.valueOf(str(m,"category").toUpperCase()));
    if(m.get("priority")!=null)c.setPriority(Priority.valueOf(str(m,"priority").toUpperCase()));
    if(m.get("riskLevel")!=null)c.setRiskLevel(RiskLevel.valueOf(str(m,"riskLevel").toUpperCase()));
    if(m.get("serviceDowntimeExpected")!=null)c.setServiceDowntimeExpected(Boolean.valueOf(str(m,"serviceDowntimeExpected")));
    if(m.get("plannedStartDate")!=null){
        Object v=m.get("plannedStartDate");
        if(v instanceof LocalDateTime ldt) c.setPlannedStartDate(ldt);
        else c.setPlannedStartDate(LocalDateTime.parse(str(m,"plannedStartDate")));
    }
    if(m.get("plannedEndDate")!=null){
        Object v=m.get("plannedEndDate");
        if(v instanceof LocalDateTime ldt) c.setPlannedEndDate(ldt);
        else c.setPlannedEndDate(LocalDateTime.parse(str(m,"plannedEndDate")));
    }
    if(m.get("customValues")!=null)c.setCustomValues(m.get("customValues").toString());if(required&&(c.getShortDescription()==null||c.getDetailedDescription()==null||c.getRequestedBy()==null||c.getRequesterEmail()==null||c.getDepartment()==null||c.getChangeType()==null||c.getCategory()==null||c.getPriority()==null||c.getRiskLevel()==null))throw new ApiExceptions.Invalid("Required fields: shortDescription, detailedDescription, requestedBy, requesterEmail, department, changeType, category, priority, riskLevel");if(c.getPlannedStartDate()!=null&&c.getPlannedEndDate()!=null&&c.getPlannedEndDate().isBefore(c.getPlannedStartDate()))throw new ApiExceptions.Invalid("plannedEndDate must be after plannedStartDate");}
 private void set(Map<String,Object> m,String k,java.util.function.Consumer<String> f){if(m.containsKey(k))f.accept(m.get(k)==null?null:String.valueOf(m.get(k)));}
 @Transactional public ChangeRequest update(Long id,Map<String,Object> m){ChangeRequest c=get(id);if(c.getStatus()!=ChangeStatus.DRAFT)throw new ApiExceptions.Conflict("Only DRAFT changes can be edited");apply(c,m,false);return repo.save(c);}
 @Transactional public ChangeRequest transition(Long id,ChangeStatus target,String by,String comments){ChangeRequest c=get(id);ChangeStatus old=c.getStatus();Map<ChangeStatus,Set<ChangeStatus>> allowed=Map.ofEntries(Map.entry(ChangeStatus.DRAFT,Set.of(ChangeStatus.SUBMITTED,ChangeStatus.CANCELLED)),Map.entry(ChangeStatus.SUBMITTED,Set.of(ChangeStatus.ASSESSMENT,ChangeStatus.CANCELLED)),Map.entry(ChangeStatus.ASSESSMENT,Set.of(ChangeStatus.UNDER_REVIEW,ChangeStatus.ON_HOLD)),Map.entry(ChangeStatus.UNDER_REVIEW,Set.of(ChangeStatus.PENDING_APPROVAL,ChangeStatus.REJECTED,ChangeStatus.ADDITIONAL_INFORMATION_REQUIRED)),Map.entry(ChangeStatus.ADDITIONAL_INFORMATION_REQUIRED,Set.of(ChangeStatus.SUBMITTED,ChangeStatus.CANCELLED)),Map.entry(ChangeStatus.PENDING_APPROVAL,Set.of(ChangeStatus.APPROVED,ChangeStatus.REJECTED)),Map.entry(ChangeStatus.APPROVED,Set.of(ChangeStatus.SCHEDULED,ChangeStatus.CANCELLED)),Map.entry(ChangeStatus.SCHEDULED,Set.of(ChangeStatus.IN_PROGRESS,ChangeStatus.CANCELLED)),Map.entry(ChangeStatus.IN_PROGRESS,Set.of(ChangeStatus.IMPLEMENTED,ChangeStatus.ROLLBACK_IN_PROGRESS)),Map.entry(ChangeStatus.IMPLEMENTED,Set.of(ChangeStatus.PENDING_VALIDATION)),Map.entry(ChangeStatus.PENDING_VALIDATION,Set.of(ChangeStatus.VALIDATED,ChangeStatus.ROLLBACK_IN_PROGRESS)),Map.entry(ChangeStatus.VALIDATED,Set.of(ChangeStatus.CLOSED)),Map.entry(ChangeStatus.ROLLBACK_IN_PROGRESS,Set.of(ChangeStatus.ROLLED_BACK)),Map.entry(ChangeStatus.ROLLED_BACK,Set.of(ChangeStatus.CLOSED)),Map.entry(ChangeStatus.ON_HOLD,Set.of(ChangeStatus.ASSESSMENT,ChangeStatus.CANCELLED)));
 if(!allowed.getOrDefault(old,Set.of()).contains(target))throw new ApiExceptions.Conflict("Invalid transition "+old+" -> "+target);if(target==ChangeStatus.IN_PROGRESS&&!Boolean.TRUE.equals(c.getStatus()==ChangeStatus.SCHEDULED))throw new ApiExceptions.Invalid("Change must be approved and scheduled before implementation");c.setStatus(target);repo.save(c);log(c,old.name(),target.name(),target.name(),by,comments);return c;}
 private void log(ChangeRequest c,String p,String n,String a,String by,String comments){history.save(new ChangeHistory(c.getId(),p,n,a,by,comments));}
 @Transactional public ChangeRequest assess(Long id,Map<String,Object> m){ChangeRequest c=get(id);if(c.getStatus()!=ChangeStatus.ASSESSMENT)throw new ApiExceptions.Conflict("Submit change before assessment");apply(c,m,false);return transition(id,ChangeStatus.UNDER_REVIEW,str(m,"performedBy"),"Risk assessment completed");}
 @Transactional public ChangeRequest review(Long id,Map<String,Object> m){ChangeRequest c=get(id);if(c.getStatus()!=ChangeStatus.UNDER_REVIEW)throw new ApiExceptions.Conflict("Change is not under review");c.setReviewer(str(m,"reviewer"));c.setReviewComments(str(m,"comments"));c.setReviewedAt(LocalDateTime.now());repo.save(c);String decision=str(m,"decision");if("REJECTED".equalsIgnoreCase(decision))return transition(id,ChangeStatus.REJECTED,str(m,"reviewer"),str(m,"comments"));if("APPROVED".equalsIgnoreCase(decision))return transition(id,ChangeStatus.PENDING_APPROVAL,str(m,"reviewer"),str(m,"comments"));return transition(id,ChangeStatus.ADDITIONAL_INFORMATION_REQUIRED,str(m,"reviewer"),str(m,"comments"));}
 @Transactional public ChangeRequest approve(Long id,Map<String,Object> m,boolean approve){ChangeRequest c=get(id);if(c.getStatus()!=ChangeStatus.PENDING_APPROVAL)throw new ApiExceptions.Conflict("Change is not pending approval");if(c.getChangeType()==ChangeType.EMERGENCY&&approve&&(str(m,"justification")==null||str(m,"justification").isBlank()))throw new ApiExceptions.Invalid("Emergency approval requires justification");c.setApprovedBy(str(m,"approvedBy"));c.setApprovalComments(str(m,"comments"));c.setApprovedAt(LocalDateTime.now());c.setEmergencyJustification(str(m,"justification"));repo.save(c);return transition(id,approve?ChangeStatus.APPROVED:ChangeStatus.REJECTED,str(m,"approvedBy"),str(m,"comments"));}
 public Page<ChangeRequest> search(String q,ChangeStatus status,ChangeType type,Pageable p){return repo.findAll((r,query,cb)->{List<jakarta.persistence.criteria.Predicate> ps=new ArrayList<>();if(q!=null&&!q.isBlank()){String like="%"+q.toLowerCase()+"%";ps.add(cb.or(cb.like(cb.lower(r.get("changeNumber")),like),cb.like(cb.lower(r.get("shortDescription")),like),cb.like(cb.lower(r.get("requestedBy")),like)));}if(status!=null)ps.add(cb.equal(r.get("status"),status));if(type!=null)ps.add(cb.equal(r.get("changeType"),type));return cb.and(ps.toArray(new jakarta.persistence.criteria.Predicate[0]));},p);}
 public List<ChangeHistory> history(Long id){get(id);return history.findByChangeIdOrderByTimestampAsc(id);}public ChangeRequest save(ChangeRequest c){return repo.save(c);}public ChangeRequest transitionPublic(Long id,ChangeStatus s,String by,String comments){return transition(id,s,by,comments);}public ChangeRequestRepository repository(){return repo;}
}
