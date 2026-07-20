package com.jianflow.admin.service;

import com.jianflow.admin.domain.AdminMenu;
import com.jianflow.admin.domain.AdminMenuRepository;
import com.jianflow.admin.util.MenuTreeBuilder;
import com.jianflow.admin.web.dto.MenuTreeDto;
import com.jianflow.admin.web.dto.UpdateMenuRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminMenuService {

    private final AdminMenuRepository adminMenuRepository;

    public AdminMenuService(AdminMenuRepository adminMenuRepository) {
        this.adminMenuRepository = adminMenuRepository;
    }

    @Transactional(readOnly = true)
    public List<MenuTreeDto> listTree() {
        return MenuTreeBuilder.buildTree(adminMenuRepository.findAllOrdered());
    }

    @Transactional
    public MenuTreeDto update(Integer id, UpdateMenuRequest request) {
        AdminMenu menu = adminMenuRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu not found"));
        if (request.name() != null) {
            menu.setName(request.name());
        }
        if (request.path() != null) {
            menu.setPath(request.path());
        }
        if (request.component() != null) {
            menu.setComponent(request.component());
        }
        if (request.permission() != null) {
            menu.setPermission(request.permission());
        }
        if (request.icon() != null) {
            menu.setIcon(request.icon());
        }
        if (request.sortOrder() != null) {
            menu.setSortOrder(request.sortOrder());
        }
        if (request.visible() != null) {
            menu.setVisible(request.visible());
        }
        if (request.status() != null) {
            menu.setStatus(request.status());
        }
        AdminMenu saved = adminMenuRepository.save(menu);
        return MenuTreeBuilder.buildTree(List.of(saved)).get(0);
    }
}
