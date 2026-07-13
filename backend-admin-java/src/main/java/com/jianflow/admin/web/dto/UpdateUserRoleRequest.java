package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserRoleRequest(
        @NotBlank @Pattern(regexp = "USER|ADMIN|SUPER_ADMIN") String role
) {}
