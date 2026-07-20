package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminWorkflowRunService;
import com.jianflow.admin.web.dto.WorkflowRunDto;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/workflow-runs")
public class AdminWorkflowRunController {

    private final AdminWorkflowRunService adminWorkflowRunService;

    public AdminWorkflowRunController(AdminWorkflowRunService adminWorkflowRunService) {
        this.adminWorkflowRunService = adminWorkflowRunService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('workflow-run:list')")
    public Map<String, Object> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "userId", required = false) Integer userId,
            @RequestParam(name = "workflowId", required = false) Integer workflowId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "runType", required = false) String runType,
            @RequestParam(name = "q", required = false) String q) {
        Page<WorkflowRunDto> result = adminWorkflowRunService.list(userId, workflowId, status, runType, q, page, size);
        return Map.of(
                "success", true,
                "data", result.getContent(),
                "meta", Map.of(
                        "page", result.getNumber(),
                        "size", result.getSize(),
                        "totalElements", result.getTotalElements(),
                        "totalPages", result.getTotalPages()
                )
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('workflow-run:list')")
    public Map<String, Object> get(@PathVariable("id") String id) {
        return Map.of("success", true, "data", adminWorkflowRunService.get(id));
    }
}
