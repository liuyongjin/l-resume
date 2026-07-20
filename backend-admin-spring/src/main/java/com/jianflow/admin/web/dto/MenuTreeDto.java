package com.jianflow.admin.web.dto;

import java.util.List;

public record MenuTreeDto(
        Integer id,
        Integer parentId,
        String name,
        String type,
        String path,
        String component,
        String permission,
        String icon,
        Integer sortOrder,
        boolean visible,
        String status,
        List<MenuTreeDto> children
) {}
