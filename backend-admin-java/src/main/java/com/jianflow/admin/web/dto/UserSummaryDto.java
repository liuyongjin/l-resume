package com.jianflow.admin.web.dto;

public record UserSummaryDto(
        Integer id,
        String username,
        String phone,
        String email,
        String role,
        String status,
        String createdAt
) {}
