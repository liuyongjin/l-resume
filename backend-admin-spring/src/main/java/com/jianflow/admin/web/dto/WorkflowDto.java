package com.jianflow.admin.web.dto;

public record WorkflowDto(
        Integer id,
        Integer userId,
        String username,
        Integer version,
        String name,
        String description,
        boolean isDefault,
        boolean active,
        String publishedAt,
        String createdAt,
        String updatedAt
) {
}
