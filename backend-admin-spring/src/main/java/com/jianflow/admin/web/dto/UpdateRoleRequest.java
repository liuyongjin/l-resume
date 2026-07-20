package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateRoleRequest(
        @Size(max = 255) String remark,
        @Pattern(regexp = "active|disabled") String status
) {}
