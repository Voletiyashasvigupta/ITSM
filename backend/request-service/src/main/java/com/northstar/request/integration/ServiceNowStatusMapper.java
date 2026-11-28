package com.northstar.request.integration;

import com.northstar.request.entity.RequestStatus;
import org.springframework.stereotype.Component;

/**
 * Documented, configurable status mapper translating between ServiceNow request/RITM
 * lifecycle states and Northstar Portal RequestStatus.
 *
 * <p><b>Lifecycle Transition Order:</b>
 * <ol>
 *   <li>Rejection check: If ServiceNow approval is {@code rejected} or state is {@code 4} (Closed Incomplete), maps to {@link RequestStatus#REJECTED}.</li>
 *   <li>Cancellation check: If ServiceNow state is {@code 7} (Closed Skipped) or {@code 8} (Closed Cancelled), or stage contains {@code cancel}, maps to {@link RequestStatus#CANCELLED}.</li>
 *   <li>Completion check: If ServiceNow state is {@code 3} (Closed Complete) or stage contains {@code complete}, maps to {@link RequestStatus#COMPLETED}.</li>
 *   <li>Fulfillment / Progress check: If ServiceNow state is {@code 2} (Work in Progress) or stage contains {@code fulfillment}/{@code delivery}, maps to {@link RequestStatus#IN_PROGRESS}.</li>
 *   <li>Approval check: If ServiceNow approval is {@code approved}, maps to {@link RequestStatus#APPROVED}.</li>
 *   <li>Pending check: If ServiceNow approval is {@code requested} or stage is {@code waiting_for_approval}, maps to {@link RequestStatus#PENDING_APPROVAL}.</li>
 * </ol>
 */
@Component
public class ServiceNowStatusMapper {

    /**
     * Maps ServiceNow RITM attributes to portal RequestStatus.
     *
     * @param approval Approval state string from ServiceNow (e.g. "requested", "approved", "rejected").
     * @param state State code from ServiceNow (e.g. "1", "2", "3", "4", "7", "8").
     * @param stage Stage string from ServiceNow (e.g. "waiting_for_approval", "fulfillment", "complete").
     * @param current Current local RequestStatus.
     * @return Target RequestStatus.
     */
    public RequestStatus mapToLocalStatus(String approval, String state, String stage, RequestStatus current) {
        String cleanApproval = approval != null ? approval.trim().toLowerCase() : "";
        String cleanStage = stage != null ? stage.trim().toLowerCase() : "";
        String cleanState = state != null ? state.trim().toLowerCase() : "";

        if ("rejected".equals(cleanApproval) || "4".equals(cleanState)) {
            return RequestStatus.REJECTED;
        }
        if ("7".equals(cleanState) || "8".equals(cleanState) || cleanStage.contains("cancel")) {
            return RequestStatus.CANCELLED;
        }
        if ("3".equals(cleanState) || cleanStage.contains("complete")) {
            return RequestStatus.COMPLETED;
        }
        if ("2".equals(cleanState) || cleanStage.contains("fulfillment") || cleanStage.contains("delivery")) {
            return RequestStatus.IN_PROGRESS;
        }
        if ("approved".equals(cleanApproval)) {
            if (current == RequestStatus.PENDING_APPROVAL || current == RequestStatus.SUBMITTED) {
                return RequestStatus.APPROVED;
            }
            return current != null ? current : RequestStatus.APPROVED;
        }
        if ("requested".equals(cleanApproval) || "waiting_for_approval".equals(cleanStage) || "1".equals(cleanState)) {
            return RequestStatus.PENDING_APPROVAL;
        }
        return current != null ? current : RequestStatus.PENDING_APPROVAL;
    }
}
