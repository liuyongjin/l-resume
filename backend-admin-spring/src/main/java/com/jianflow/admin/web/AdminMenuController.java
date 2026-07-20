package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminMenuService;
import com.jianflow.admin.web.dto.UpdateMenuRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/menus")
public class AdminMenuController {

    private final AdminMenuService adminMenuService;

    public AdminMenuController(AdminMenuService adminMenuService) {
        this.adminMenuService = adminMenuService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('menu:list')")
    public Map<String, Object> listTree() {
        return Map.of("success", true, "data", adminMenuService.listTree());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('menu:update')")
    public Map<String, Object> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateMenuRequest body) {
        return Map.of("success", true, "data", adminMenuService.update(id, body));
    }
}
