package com.jianflow.admin.web;

import com.jianflow.admin.service.FrontUserService;
import com.jianflow.admin.web.dto.FrontUserDto;
import com.jianflow.admin.web.dto.UpdateUserStatusRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/front-users")
public class FrontUserController {

    private final FrontUserService frontUserService;

    public FrontUserController(FrontUserService frontUserService) {
        this.frontUserService = frontUserService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('front-user:list')")
    public Map<String, Object> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "q", required = false) String q) {
        Page<FrontUserDto> result = frontUserService.list(q, page, size);
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

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('front-user:status')")
    public Map<String, Object> updateStatus(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateUserStatusRequest body) {
        return Map.of("success", true, "data", frontUserService.updateStatus(id, body.status()));
    }
}
