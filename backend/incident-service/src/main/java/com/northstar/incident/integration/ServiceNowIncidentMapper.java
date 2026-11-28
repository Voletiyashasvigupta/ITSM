package com.northstar.incident.integration;

import org.springframework.stereotype.Component;

/**
 * Documented, configurable status and field mapping component between Northstar Incident Service
 * and ServiceNow Incident table ({@code incident}).
 *
 * <p><b>ServiceNow Incident State Mappings:</b>
 * <ul>
 *   <li>1: New -> "New"</li>
 *   <li>2: In Progress -> "In Progress"</li>
 *   <li>3: On Hold -> "On Hold"</li>
 *   <li>6: Resolved -> "Resolved"</li>
 *   <li>7: Closed -> "Closed"</li>
 *   <li>8: Canceled -> "Canceled"</li>
 * </ul>
 *
 * <p><b>ITIL Priority / Urgency / Impact Mappings:</b>
 * <ul>
 *   <li>1 - High / Critical -> "1"</li>
 *   <li>2 - Medium / High -> "2"</li>
 *   <li>3 - Low / Moderate -> "3"</li>
 * </ul>
 *
 * <p><b>Default Assignment Group:</b>
 * <ul>
 *   <li>Incident Management: {@code 12a586cd0bb23200ecfd818393673a30}</li>
 * </ul>
 */
@Component
public class ServiceNowIncidentMapper {

    public static final String DEFAULT_ASSIGNMENT_GROUP = "12a586cd0bb23200ecfd818393673a30";

    /**
     * Maps ServiceNow incident state code (1, 2, 3, 6, 7, 8) to local portal state.
     */
    public String mapServiceNowStateToLocal(String snState) {
        if (snState == null || snState.isBlank()) return null;
        return switch (snState.trim()) {
            case "1" -> "New";
            case "2" -> "In Progress";
            case "3" -> "On Hold";
            case "6" -> "Resolved";
            case "7" -> "Closed";
            case "8" -> "Canceled";
            default -> null;
        };
    }

    /**
     * Maps local portal state ("New", "In Progress", "On Hold", "Resolved", "Closed", "Canceled") to ServiceNow state code.
     */
    public String mapLocalStateToServiceNow(String localState) {
        if (localState == null) return "1";
        return switch (localState.trim().toLowerCase()) {
            case "in progress" -> "2";
            case "on hold" -> "3";
            case "resolved" -> "6";
            case "closed" -> "7";
            case "canceled", "cancelled" -> "8";
            default -> "1";
        };
    }

    /**
     * Maps human-readable impact / urgency strings to ServiceNow 1-based severity code.
     */
    public String mapSeverityToServiceNow(String severity) {
        if (severity == null) return "3";
        String s = severity.trim();
        if (s.startsWith("1")) return "1";
        if (s.startsWith("2")) return "2";
        return "3";
    }
}
