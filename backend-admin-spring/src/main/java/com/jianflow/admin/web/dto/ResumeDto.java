package com.jianflow.admin.web.dto;

public record ResumeDto(
        Integer id,
        Integer userId,
        String username,
        String title,
        String templateId,
        String source,
        boolean favorite,
        boolean shared,
        String createdAt,
        String updatedAt
) {
}
