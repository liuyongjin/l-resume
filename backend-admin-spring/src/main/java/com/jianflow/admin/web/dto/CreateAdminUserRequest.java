package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateAdminUserRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank @Size(min = 6, max = 64) String password,
        @Size(max = 100) String nickname,
        List<Integer> roleIds
) {}
