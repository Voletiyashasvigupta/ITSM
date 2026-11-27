package com.northstar.auth.entity;

/**
 * Enumeration representing portal security roles.
 *
 * <p><b>Purpose:</b> Defines authorization tiers within Northstar: standard {@code EMPLOYEE} access and combined
 * administrative/supervisory {@code MANAGER_ADMIN} access.
 *
 * <p><b>Downstream / Workflow:</b> Encoded in issued JWT "roles" claims, interpreted by the API Gateway to enforce
 * endpoint access control, and evaluated by microservices for administrative privileges.
 */
public enum PortalRole {
    EMPLOYEE,
    MANAGER_ADMIN
}
