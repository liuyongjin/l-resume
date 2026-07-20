package com.jianflow.admin.web.dto;

import java.util.List;

public record WorkflowRunDto(
        String id,
        Integer userId,
        String username,
        Integer workflowId,
        String workflowName,
        String runType,
        String status,
        String errorMessage,
        String startedAt,
        String completedAt,
        String createdAt,
        List<WorkflowStepDto> steps
) {
}
