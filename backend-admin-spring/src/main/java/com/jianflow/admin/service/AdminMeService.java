package com.jianflow.admin.service;

import com.jianflow.admin.domain.AdminMenu;
import com.jianflow.admin.domain.AdminMenuRepository;
import com.jianflow.admin.domain.AdminRole;
import com.jianflow.admin.domain.AdminUser;
import com.jianflow.admin.domain.AdminUserRepository;
import com.jianflow.admin.util.MenuTreeBuilder;
import com.jianflow.admin.web.dto.MenuTreeDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminMeService {

    private final AdminUserRepository adminUserRepository;
    private final AdminMenuRepository adminMenuRepository;

    public AdminMeService(AdminUserRepository adminUserRepository, AdminMenuRepository adminMenuRepository) {
        this.adminUserRepository = adminUserRepository;
        this.adminMenuRepository = adminMenuRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> currentUser(Integer userId) {
        AdminUser user = adminUserRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));

        List<String> roles = user.getRoles().stream()
                .filter(AdminRole::isActive)
                .map(AdminRole::getCode)
                .sorted()
                .toList();

        List<String> permissions = new ArrayList<>(adminMenuRepository.findPermissionCodesByUserId(userId));
        permissions.sort(Comparator.naturalOrder());

        List<AdminMenu> navMenus = adminMenuRepository.findVisibleNavMenusByUserId(userId);
        List<MenuTreeDto> menus = MenuTreeBuilder.buildTree(navMenus);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("username", user.getUsername());
        data.put("nickname", user.getNickname());
        data.put("roles", roles);
        data.put("permissions", permissions);
        data.put("menus", menus);
        return data;
    }
}
