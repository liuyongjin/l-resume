package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminResumeService;
import com.jianflow.admin.web.dto.ResumeDto;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/resumes")
public class AdminResumeController {

    private final AdminResumeService adminResumeService;

    public AdminResumeController(AdminResumeService adminResumeService) {
        this.adminResumeService = adminResumeService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('resume:list')")
    public Map<String, Object> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "userId", required = false) Integer userId,
            @RequestParam(name = "q", required = false) String q) {
        Page<ResumeDto> result = adminResumeService.list(userId, q, page, size);
        return pageResponse(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('resume:list')")
    public Map<String, Object> get(@PathVariable("id") Integer id) {
        return Map.of("success", true, "data", adminResumeService.get(id));
    }

    private static Map<String, Object> pageResponse(Page<?> result) {
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
}
