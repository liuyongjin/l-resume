package com.jianflow.admin.web;

import com.jianflow.admin.service.AdminMeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminMeController {

    private final AdminMeService adminMeService;

    public AdminMeController(AdminMeService adminMeService) {
        this.adminMeService = adminMeService;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        Number userId = jwt.getClaim("userId");
        return Map.of("success", true, "data", adminMeService.currentUser(userId.intValue()));
    }
}
