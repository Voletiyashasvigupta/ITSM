package com.itsm.changemanagement.entity;

/**
 * Enumeration of change categories classifying affected technical domains.
 *
 * <p><b>Purpose:</b> Categorizes RFCs by technical area (Software, Hardware, Network, Database, Security, etc.).
 *
 * <p><b>Downstream / Workflow:</b> Stored in {@link ChangeRequest#getCategory()} and utilized for routing and CAB review scoping.
 */
public enum ChangeCategory {
    SOFTWARE,
    HARDWARE,
    NETWORK,
    DATABASE,
    SECURITY,
    INFRASTRUCTURE,
    APPLICATION,
    OTHER
}
