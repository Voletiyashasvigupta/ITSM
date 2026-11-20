package com.northstar.request.controller;

import com.northstar.request.dto.*;
import com.northstar.request.service.LocalApprovalService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/approvals")
public class ApprovalsController {
    private final LocalApprovalService approvals;
    public ApprovalsController(LocalApprovalService approvals){this.approvals=approvals;}
    @GetMapping("/pending") public List<?> pending(@AuthenticationPrincipal Jwt jwt){return approvals.pending(jwt.getSubject(),RequestController.isManager(jwt));}
    @GetMapping("/history") public List<?> history(@AuthenticationPrincipal Jwt jwt){return approvals.history(jwt.getSubject(),RequestController.isManager(jwt));}
    @PostMapping("/{id}/approve") public Object approve(@PathVariable("id") UUID id,@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody(required=false) DecisionInput input){return approvals.decide(id,jwt.getSubject(),true,input==null?null:input.comment());}
    @PostMapping("/{id}/reject") public Object reject(@PathVariable("id") UUID id,@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody DecisionInput input){return approvals.decide(id,jwt.getSubject(),false,input.comment());}
}
