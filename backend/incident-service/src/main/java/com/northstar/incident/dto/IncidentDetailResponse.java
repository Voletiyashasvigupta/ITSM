package com.northstar.incident.dto;
import com.northstar.incident.entity.IncidentCommentEntity;
import java.util.List;
public record IncidentDetailResponse(IncidentResponse incident,List<IncidentCommentEntity> comments) {}
