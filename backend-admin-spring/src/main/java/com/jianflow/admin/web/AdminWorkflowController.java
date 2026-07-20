package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminWorkflowService;
import com.jianflow.admin.web.dto.WorkflowDto;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/workflows")
public class AdminWorkflowController {

    private final AdminWorkflowService adminWorkflowService;

    public AdminWorkflowController(AdminWorkflowService adminWorkflowService) {
        this.adminWorkflowService = adminWorkflowService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('workflow:list')")
    public Map<String, Object> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "userId", required = false) Integer userId,
            @RequestParam(name = "q", required = false) String q) {
        Page<WorkflowDto> result = adminWorkflowService.list(userId, q, page, size);
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
    @PreAuthorize("hasAuthority('workflow:list')")
    public Map<String, Object> get(@PathVariable("id") Integer id) {
        return Map.of("success", true, "data", adminWorkflowService.get(id));
    }
}
