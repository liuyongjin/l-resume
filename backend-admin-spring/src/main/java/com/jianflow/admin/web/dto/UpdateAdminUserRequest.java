package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAdminUserRequest(
        @Size(max = 100) String nickname,
        @Pattern(regexp = "active|disabled") String status,
        @Size(min = 6, max = 64) String password
) {}
