package com.northstar.auth.entity;

/**
 * Enumeration representing corporate business departments for employee routing and scoping.
 *
 * <p><b>Purpose:</b> Categorizes employees by department to support organizational hierarchy, request ownership,
 * and department-specific approval logic.
 *
 * <p><b>Downstream / Workflow:</b> Stored in {@link PortalUser#department} and embedded in user profile DTOs
 * for display and entitlement checks across the portal.
 */
public enum EmployeeDepartment {
    IT,
    SOFTWARE_ENGINEERING,
    SALES,
    ADMINISTRATION,
    HUMAN_RESOURCES,
    FINANCE,
    FACILITIES,
    OPERATIONS,
    CUSTOMER_SUPPORT,
    LEGAL,
    OTHER
}
