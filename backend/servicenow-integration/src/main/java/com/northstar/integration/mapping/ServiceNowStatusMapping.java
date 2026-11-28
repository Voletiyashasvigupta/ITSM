package com.northstar.integration.mapping;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Single documented, centralized, and configurable repository of status, stage, priority,
 * and lifecycle transitions between the Northstar Portal and ServiceNow tables.
 *
 * <p><b>Covered ServiceNow Entities:</b>
 * <ul>
 *   <li><b>sc_request (Requests):</b> Maps overall container request states and approvals.</li>
 *   <li><b>sc_req_item (Requested Items):</b> Maps line-item states, stages, and approvals to Portal RequestStatus.</li>
 *   <li><b>incident (Incidents):</b> Maps ITIL incident states, urgency/impact metrics, and resolution statuses.</li>
 * </ul>
 */
public final class ServiceNowStatusMapping {

    // -------------------------------------------------------------------------
    // 1. ServiceNow sc_request State & Approval Mapping
    // -------------------------------------------------------------------------
    public static final Map<String, String> SC_REQUEST_STATES = Map.of(
            "in_process", "IN_PROGRESS",
            "closed_complete", "COMPLETED",
            "closed_incomplete", "REJECTED",
            "closed_cancelled", "CANCELLED"
    );

    // -------------------------------------------------------------------------
    // 2. ServiceNow sc_req_item (RITM) State Mapping
    // -------------------------------------------------------------------------
    public static final Map<String, String> SC_REQ_ITEM_STATES = Map.of(
            "1", "PENDING_APPROVAL", // Open
            "2", "IN_PROGRESS",      // Work in Progress
            "3", "COMPLETED",        // Closed Complete
            "4", "REJECTED",         // Closed Incomplete
            "7", "CANCELLED",        // Closed Skipped
            "8", "CANCELLED"         // Closed Cancelled
    );

    // -------------------------------------------------------------------------
    // 3. ServiceNow sc_req_item (RITM) Stage Mapping
    // -------------------------------------------------------------------------
    public static final Map<String, String> SC_REQ_ITEM_STAGES = Map.of(
            "waiting_for_approval", "PENDING_APPROVAL",
            "request_approved", "APPROVED",
            "fulfillment", "IN_PROGRESS",
            "delivery", "IN_PROGRESS",
            "complete", "COMPLETED",
            "request_cancelled", "CANCELLED"
    );

    // -------------------------------------------------------------------------
    // 4. ServiceNow Approval State Mapping
    // -------------------------------------------------------------------------
    public static final Map<String, String> APPROVAL_STATES = Map.of(
            "not requested", "SUBMITTED",
            "requested", "PENDING_APPROVAL",
            "approved", "APPROVED",
            "rejected", "REJECTED"
    );

    // -------------------------------------------------------------------------
    // 5. ServiceNow Incident State Mapping
    // -------------------------------------------------------------------------
    public static final Map<String, String> INCIDENT_STATES_TO_PORTAL = Map.of(
            "1", "New",
            "2", "In Progress",
            "3", "On Hold",
            "6", "Resolved",
            "7", "Closed",
            "8", "Canceled"
    );

    public static final Map<String, String> INCIDENT_PORTAL_TO_SN_STATE = Map.of(
            "new", "1",
            "in progress", "2",
            "on hold", "3",
            "resolved", "6",
            "closed", "7",
            "canceled", "8",
            "cancelled", "8"
    );

    // -------------------------------------------------------------------------
    // 6. Impact & Urgency Matrix -> Priority (1 to 5)
    // -------------------------------------------------------------------------
    public static final Map<String, String> IMPACT_URGENCY_TO_SN_VALUE = Map.ofEntries(
            Map.entry("1", "1"),
            Map.entry("1 - high", "1"),
            Map.entry("high", "1"),
            Map.entry("critical", "1"),
            Map.entry("2", "2"),
            Map.entry("2 - medium", "2"),
            Map.entry("medium", "2"),
            Map.entry("moderate", "2"),
            Map.entry("3", "3"),
            Map.entry("3 - low", "3"),
            Map.entry("low", "3")
    );

    private ServiceNowStatusMapping() {}

    /**
     * Resolves the combined Northstar RequestStatus from ServiceNow sc_req_item attributes.
     * Evaluates approval, state, and stage in hierarchical ITIL order.
     */
    public static String mapRitmToPortalStatus(String approval, String state, String stage, String currentStatus) {
        String cleanApproval = approval != null ? approval.trim().toLowerCase() : "";
        String cleanStage = stage != null ? stage.trim().toLowerCase() : "";
        String cleanState = state != null ? state.trim().toLowerCase() : "";

        if ("rejected".equals(cleanApproval) || "4".equals(cleanState)) {
            return "REJECTED";
        }
        if ("7".equals(cleanState) || "8".equals(cleanState) || cleanStage.contains("cancel")) {
            return "CANCELLED";
        }
        if ("3".equals(cleanState) || cleanStage.contains("complete")) {
            return "COMPLETED";
        }
        if ("2".equals(cleanState) || cleanStage.contains("fulfillment") || cleanStage.contains("delivery")) {
            return "IN_PROGRESS";
        }
        if ("approved".equals(cleanApproval)) {
            if ("PENDING_APPROVAL".equals(currentStatus) || "SUBMITTED".equals(currentStatus)) {
                return "APPROVED";
            }
            return currentStatus != null ? currentStatus : "APPROVED";
        }
        if ("requested".equals(cleanApproval) || "waiting_for_approval".equals(cleanStage) || "1".equals(cleanState)) {
            return "PENDING_APPROVAL";
        }
        return currentStatus != null ? currentStatus : "PENDING_APPROVAL";
    }

    /**
     * Resolves ServiceNow incident state code (1-8) from portal state name.
     */
    public static String mapPortalToIncidentState(String portalState) {
        if (portalState == null || portalState.isBlank()) return "1";
        return INCIDENT_PORTAL_TO_SN_STATE.getOrDefault(portalState.trim().toLowerCase(), "1");
    }

    /**
     * Resolves portal incident state name from ServiceNow state code.
     */
    public static String mapIncidentStateToPortal(String snState) {
        if (snState == null || snState.isBlank()) return "New";
        return INCIDENT_STATES_TO_PORTAL.getOrDefault(snState.trim(), "New");
    }

    /**
     * Normalizes user-entered impact/urgency to ServiceNow numeric value ("1", "2", "3").
     */
    public static String mapPriorityMetric(String metric) {
        if (metric == null || metric.isBlank()) return "3";
        return IMPACT_URGENCY_TO_SN_VALUE.getOrDefault(metric.trim().toLowerCase(), "3");
    }

    /**
     * Exports full dictionary for documentation, reporting, and API consumers.
     */
    public static Map<String, Object> exportFullMappingSpecification() {
        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("description", "Portal-to-ServiceNow single documented status and field mapping specification");
        doc.put("sc_request_states", SC_REQUEST_STATES);
        doc.put("sc_req_item_states", SC_REQ_ITEM_STATES);
        doc.put("sc_req_item_stages", SC_REQ_ITEM_STAGES);
        doc.put("approval_states", APPROVAL_STATES);
        doc.put("incident_states", INCIDENT_STATES_TO_PORTAL);
        doc.put("impact_urgency_mappings", IMPACT_URGENCY_TO_SN_VALUE);
        return Collections.unmodifiableMap(doc);
    }
}
