package com.jianflow.admin.web.dto;

import java.util.List;

public record AdminUserDto(
        Integer id,
        String username,
        String nickname,
        String status,
        String createdAt,
        List<Integer> roleIds,
        List<String> roleCodes
) {}
