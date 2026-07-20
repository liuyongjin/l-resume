package com.jianflow.admin.web.dto;

public record WorkflowStepDto(
        Integer id,
        Integer resumeId,
        Integer workflowId,
        String executionGroupId,
        Integer stepOrder,
        String stepKey,
        String stepName,
        String nodeId,
        String stepCategory,
        String status,
        String error,
        Integer durationMs,
        String startedAt,
        String completedAt,
        String createdAt
) {
}
