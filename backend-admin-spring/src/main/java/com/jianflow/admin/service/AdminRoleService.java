package com.jianflow.admin.service;

import com.jianflow.admin.domain.AdminMenu;
import com.jianflow.admin.domain.AdminMenuRepository;
import com.jianflow.admin.domain.AdminRole;
import com.jianflow.admin.domain.AdminRoleRepository;
import com.jianflow.admin.web.dto.AdminRoleDto;
import com.jianflow.admin.web.dto.UpdateRoleRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@Service
public class AdminRoleService {

    private final AdminRoleRepository adminRoleRepository;
    private final AdminMenuRepository adminMenuRepository;

    public AdminRoleService(AdminRoleRepository adminRoleRepository, AdminMenuRepository adminMenuRepository) {
        this.adminRoleRepository = adminRoleRepository;
        this.adminMenuRepository = adminMenuRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminRoleDto> list() {
        return adminRoleRepository.findAllOrderById().stream()
                .map(role -> adminRoleRepository.findByIdWithMenus(role.getId()).orElse(role))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AdminRoleDto update(Integer id, UpdateRoleRequest request) {
        AdminRole role = adminRoleRepository.findByIdWithMenus(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found"));
        if (request.remark() != null) {
            role.setRemark(request.remark());
        }
        if (request.status() != null) {
            role.setStatus(request.status());
        }
        return toDto(adminRoleRepository.save(role));
    }

    @Transactional
    public AdminRoleDto assignMenus(Integer id, List<Integer> menuIds) {
        AdminRole role = adminRoleRepository.findByIdWithMenus(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found"));
        List<Integer> ids = menuIds != null ? menuIds : List.of();
        List<AdminMenu> menus = adminMenuRepository.findByIdIn(ids);
        if (menus.size() != ids.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "存在无效菜单 ID");
        }
        role.setMenus(new HashSet<>(menus));
        return toDto(adminRoleRepository.save(role));
    }

    private AdminRoleDto toDto(AdminRole role) {
        List<Integer> menuIds = role.getMenus().stream().map(AdminMenu::getId).sorted().toList();
        return new AdminRoleDto(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getRemark(),
                role.getStatus(),
                menuIds
        );
    }
}
