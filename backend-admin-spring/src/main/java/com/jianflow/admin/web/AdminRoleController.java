package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminRoleService;
import com.jianflow.admin.web.dto.AssignMenusRequest;
import com.jianflow.admin.web.dto.UpdateRoleRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/roles")
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    public AdminRoleController(AdminRoleService adminRoleService) {
        this.adminRoleService = adminRoleService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('role:list')")
    public Map<String, Object> list() {
        return Map.of("success", true, "data", adminRoleService.list());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('role:update')")
    public Map<String, Object> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateRoleRequest body) {
        return Map.of("success", true, "data", adminRoleService.update(id, body));
    }

    @PutMapping("/{id}/menus")
    @PreAuthorize("hasAuthority('role:assign-menu')")
    public Map<String, Object> assignMenus(
            @PathVariable("id") Integer id,
            @Valid @RequestBody AssignMenusRequest body) {
        return Map.of("success", true, "data", adminRoleService.assignMenus(id, body.menuIds()));
    }
}
