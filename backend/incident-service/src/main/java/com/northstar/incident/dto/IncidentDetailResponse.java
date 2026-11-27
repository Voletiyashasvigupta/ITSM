package com.northstar.incident.dto;
import com.northstar.incident.entity.IncidentCommentEntity;
import java.util.List;
/**
 * Data transfer record providing full incident details alongside associated work comments.
 *
 * <p><b>Purpose:</b> Comprehensive ticket representation for the detail and discussion view.
 *
 * <p><b>Downstream / Workflow:</b> Returned by {@code GET /api/incidents/{id}} and rendered on the incident drawer/page.
 *
 * @param incident Core incident summary.
 * @param comments Chronological list of ticket comments.
 */
public record IncidentDetailResponse(IncidentResponse incident,List<IncidentCommentEntity> comments) {}
