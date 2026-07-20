package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminUserService;
import com.jianflow.admin.web.dto.AdminUserDto;
import com.jianflow.admin.web.dto.AssignRolesRequest;
import com.jianflow.admin.web.dto.CreateAdminUserRequest;
import com.jianflow.admin.web.dto.UpdateAdminUserRequest;
import com.jianflow.admin.web.dto.UpdateUserStatusRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/admin-users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('admin-user:list')")
    public Map<String, Object> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "q", required = false) String q) {
        Page<AdminUserDto> result = adminUserService.list(q, page, size);
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

    @PostMapping
    @PreAuthorize("hasAuthority('admin-user:create')")
    public Map<String, Object> create(@Valid @RequestBody CreateAdminUserRequest body) {
        return Map.of("success", true, "data", adminUserService.create(body));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('admin-user:update')")
    public Map<String, Object> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateAdminUserRequest body) {
        return Map.of("success", true, "data", adminUserService.update(id, body));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('admin-user:update')")
    public Map<String, Object> updateStatus(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateUserStatusRequest body) {
        return Map.of("success", true, "data", adminUserService.updateStatus(id, body.status()));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('admin-user:assign-role')")
    public Map<String, Object> assignRoles(
            @PathVariable("id") Integer id,
            @Valid @RequestBody AssignRolesRequest body) {
        return Map.of("success", true, "data", adminUserService.assignRoles(id, body.roleIds()));
    }
}
