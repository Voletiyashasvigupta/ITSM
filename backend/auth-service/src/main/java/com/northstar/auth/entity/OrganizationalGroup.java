package com.northstar.auth.entity;

/**
 * Enumeration representing corporate organizational groups.
 *
 * <p><b>Purpose:</b> Groups departments and employees into high-level business divisions such as
 * General, Corporate, and Company Infrastructure for routing and reporting structures.
 */
public enum OrganizationalGroup {
    GENERAL("General"),
    CORPORATE("Corporate"),
    COMPANY_INFRASTRUCTURE("Company Infrastructure");

    private final String displayName;

    OrganizationalGroup(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
