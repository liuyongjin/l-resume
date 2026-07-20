package com.jianflow.admin.service;

import com.jianflow.admin.domain.AdminRole;
import com.jianflow.admin.domain.AdminRoleRepository;
import com.jianflow.admin.domain.AdminUser;
import com.jianflow.admin.domain.AdminUserRepository;
import com.jianflow.admin.web.dto.AdminUserDto;
import com.jianflow.admin.web.dto.CreateAdminUserRequest;
import com.jianflow.admin.web.dto.UpdateAdminUserRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminUserService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final AdminUserRepository adminUserRepository;
    private final AdminRoleRepository adminRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            AdminUserRepository adminUserRepository,
            AdminRoleRepository adminRoleRepository,
            PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.adminRoleRepository = adminRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> list(String q, int page, int size) {
        return adminUserRepository.search(q, PageRequest.of(page, size)).map(user -> {
            AdminUser withRoles = adminUserRepository.findByIdWithRoles(user.getId()).orElse(user);
            return toDto(withRoles);
        });
    }

    @Transactional
    public AdminUserDto create(CreateAdminUserRequest request) {
        if (adminUserRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已存在");
        }
        AdminUser user = new AdminUser();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setNickname(request.nickname() != null ? request.nickname() : request.username());
        user.setStatus("active");
        if (request.roleIds() != null && !request.roleIds().isEmpty()) {
            user.setRoles(new HashSet<>(resolveRoles(request.roleIds())));
        }
        return toDto(adminUserRepository.save(user));
    }

    @Transactional
    public AdminUserDto update(Integer id, UpdateAdminUserRequest request) {
        AdminUser user = adminUserRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));
        if (request.nickname() != null) {
            user.setNickname(request.nickname());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        return toDto(adminUserRepository.save(user));
    }

    @Transactional
    public AdminUserDto updateStatus(Integer id, String status) {
        AdminUser user = adminUserRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));
        user.setStatus(status);
        return toDto(adminUserRepository.save(user));
    }

    @Transactional
    public AdminUserDto assignRoles(Integer id, List<Integer> roleIds) {
        AdminUser user = adminUserRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));
        user.setRoles(new HashSet<>(resolveRoles(roleIds != null ? roleIds : List.of())));
        return toDto(adminUserRepository.save(user));
    }

    private Set<AdminRole> resolveRoles(List<Integer> roleIds) {
        List<AdminRole> roles = adminRoleRepository.findByIdIn(roleIds);
        if (roles.size() != roleIds.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "存在无效角色 ID");
        }
        return new HashSet<>(roles);
    }

    private AdminUserDto toDto(AdminUser user) {
        List<Integer> roleIds = user.getRoles().stream().map(AdminRole::getId).sorted().toList();
        List<String> roleCodes = user.getRoles().stream().map(AdminRole::getCode).sorted().toList();
        return new AdminUserDto(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getStatus(),
                user.getCreatedAt() != null ? ISO.format(user.getCreatedAt()) : null,
                roleIds,
                roleCodes
        );
    }
}
