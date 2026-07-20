package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
        @NotBlank @Pattern(regexp = "active|disabled") String status
) {}
