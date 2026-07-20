package com.jianflow.admin.web.dto;

public record FrontUserDto(
        Integer id,
        String username,
        String phone,
        String email,
        String role,
        String status,
        String createdAt
) {}
