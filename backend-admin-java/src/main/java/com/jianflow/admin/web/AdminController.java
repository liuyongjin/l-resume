package com.jianflow.admin.web;

import com.jianflow.admin.user.User;
import com.jianflow.admin.user.UserRepository;
import com.jianflow.admin.web.dto.UpdateUserRoleRequest;
import com.jianflow.admin.web.dto.UpdateUserStatusRequest;
import com.jianflow.admin.web.dto.UserSummaryDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("adminUsers", userRepository.countByRole("ADMIN") + userRepository.countByRole("SUPER_ADMIN"));
        stats.put("activeUsers", userRepository.countByStatus("active"));
        stats.put("disabledUsers", userRepository.countByStatus("disabled"));
        return Map.of("success", true, "data", stats);
    }

    @GetMapping("/users")
    public Map<String, Object> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        Page<User> users = userRepository.search(q, PageRequest.of(page, size));
        Page<UserSummaryDto> dto = users.map(this::toSummary);
        return Map.of(
                "success", true,
                "data", dto.getContent(),
                "meta", Map.of(
                        "page", dto.getNumber(),
                        "size", dto.getSize(),
                        "totalElements", dto.getTotalElements(),
                        "totalPages", dto.getTotalPages()
                )
        );
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Map<String, Object> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRoleRequest body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setRole(body.role());
        userRepository.save(user);
        return Map.of("success", true, "data", toSummary(user));
    }

    @PatchMapping("/users/{id}/status")
    public Map<String, Object> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserStatusRequest body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(body.status());
        userRepository.save(user);
        return Map.of("success", true, "data", toSummary(user));
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("success", true, "data", Map.of(
                "username", jwt.getSubject(),
                "userId", jwt.getClaim("userId"),
                "roles", jwt.getClaim("roles")
        ));
    }

    private UserSummaryDto toSummary(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getPhone(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt() != null ? ISO.format(user.getCreatedAt()) : null
        );
    }
}
