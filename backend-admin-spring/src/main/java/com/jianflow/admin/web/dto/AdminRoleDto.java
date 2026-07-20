package com.jianflow.admin.web.dto;

import java.util.List;

public record AdminRoleDto(
        Integer id,
        String code,
        String name,
        String remark,
        String status,
        List<Integer> menuIds
) {}
