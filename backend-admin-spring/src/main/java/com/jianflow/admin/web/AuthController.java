package com.jianflow.admin.web;

import com.jianflow.admin.auth.AdminAuthService;
import com.jianflow.admin.web.dto.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AdminAuthService adminAuthService;

    public AuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest body) {
        AdminAuthService.LoginResult result = adminAuthService.login(body.username(), body.password());
        return Map.of(
                "success", true,
                "data", Map.of(
                        "accessToken", result.accessToken(),
                        "expiresIn", result.expiresIn()
                )
        );
    }
}
