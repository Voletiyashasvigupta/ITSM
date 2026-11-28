package com.northstar.incident.integration;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ServiceNowIncidentMapperTest {

    private ServiceNowIncidentMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ServiceNowIncidentMapper();
    }

    @Test
    void mapsServiceNowStateCodeToLocalState() {
        assertEquals("New", mapper.mapServiceNowStateToLocal("1"));
        assertEquals("In Progress", mapper.mapServiceNowStateToLocal("2"));
        assertEquals("On Hold", mapper.mapServiceNowStateToLocal("3"));
        assertEquals("Resolved", mapper.mapServiceNowStateToLocal("6"));
        assertEquals("Closed", mapper.mapServiceNowStateToLocal("7"));
        assertEquals("Canceled", mapper.mapServiceNowStateToLocal("8"));
        assertNull(mapper.mapServiceNowStateToLocal("unknown"));
    }

    @Test
    void mapsLocalStateToServiceNowStateCode() {
        assertEquals("1", mapper.mapLocalStateToServiceNow("New"));
        assertEquals("2", mapper.mapLocalStateToServiceNow("In Progress"));
        assertEquals("3", mapper.mapLocalStateToServiceNow("On Hold"));
        assertEquals("6", mapper.mapLocalStateToServiceNow("Resolved"));
        assertEquals("7", mapper.mapLocalStateToServiceNow("Closed"));
        assertEquals("8", mapper.mapLocalStateToServiceNow("Canceled"));
        assertEquals("8", mapper.mapLocalStateToServiceNow("Cancelled"));
    }

    @Test
    void mapsSeverityLevelsCorrectly() {
        assertEquals("1", mapper.mapSeverityToServiceNow("1 - Critical"));
        assertEquals("2", mapper.mapSeverityToServiceNow("2 - High"));
        assertEquals("3", mapper.mapSeverityToServiceNow("3 - Low"));
        assertEquals("3", mapper.mapSeverityToServiceNow("4 - Low"));
        assertEquals("3", mapper.mapSeverityToServiceNow(null));
    }

    @Test
    void providesDefaultAssignmentGroup() {
        assertEquals("12a586cd0bb23200ecfd818393673a30", ServiceNowIncidentMapper.DEFAULT_ASSIGNMENT_GROUP);
    }
}
