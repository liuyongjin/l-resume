package com.jianflow.admin.service;

import com.jianflow.admin.web.dto.WorkflowRunDto;
import com.jianflow.admin.web.dto.WorkflowStepDto;
import com.jianflow.admin.workflow.Workflow;
import com.jianflow.admin.workflow.WorkflowExecutionRun;
import com.jianflow.admin.workflow.WorkflowExecutionRunRepository;
import com.jianflow.admin.workflow.WorkflowRepository;
import com.jianflow.admin.workflow.WorkflowStep;
import com.jianflow.admin.workflow.WorkflowStepRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminWorkflowRunService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final WorkflowExecutionRunRepository runRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowRepository workflowRepository;
    private final UsernameResolver usernameResolver;

    public AdminWorkflowRunService(
            WorkflowExecutionRunRepository runRepository,
            WorkflowStepRepository stepRepository,
            WorkflowRepository workflowRepository,
            UsernameResolver usernameResolver) {
        this.runRepository = runRepository;
        this.stepRepository = stepRepository;
        this.workflowRepository = workflowRepository;
        this.usernameResolver = usernameResolver;
    }

    @Transactional(readOnly = true)
    public Page<WorkflowRunDto> list(
            Integer userId,
            Integer workflowId,
            String status,
            String runType,
            String q,
            int page,
            int size) {
        Page<WorkflowExecutionRun> result = runRepository.search(
                userId, workflowId, blankToNull(status), blankToNull(runType), blankToNull(q),
                PageRequest.of(page, size));

        Set<Integer> userIds = result.getContent().stream()
                .map(WorkflowExecutionRun::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Integer> workflowIds = result.getContent().stream()
                .map(WorkflowExecutionRun::getWorkflowId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, String> names = usernameResolver.resolve(userIds);
        Map<Integer, String> workflowNames = workflowRepository.findAllById(workflowIds).stream()
                .collect(Collectors.toMap(Workflow::getId, Workflow::getName, (a, b) -> a));

        return result.map(r -> toDto(
                r,
                names.get(r.getUserId()),
                r.getWorkflowId() != null ? workflowNames.get(r.getWorkflowId()) : null,
                List.of()));
    }

    @Transactional(readOnly = true)
    public WorkflowRunDto get(String id) {
        WorkflowExecutionRun run = runRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Execution run not found"));
        String username = usernameResolver.resolveOne(run.getUserId());
        String workflowName = null;
        if (run.getWorkflowId() != null) {
            workflowName = workflowRepository.findById(run.getWorkflowId())
                    .map(Workflow::getName)
                    .orElse(null);
        }
        List<WorkflowStepDto> steps = stepRepository
                .findByExecutionGroupIdOrderByStepOrderAscIdAsc(id)
                .stream()
                .map(this::toStepDto)
                .toList();
        return toDto(run, username, workflowName, steps);
    }

    private WorkflowRunDto toDto(WorkflowExecutionRun r, String username, String workflowName, List<WorkflowStepDto> steps) {
        return new WorkflowRunDto(
                r.getId(),
                r.getUserId(),
                username,
                r.getWorkflowId(),
                workflowName,
                r.getRunType(),
                r.getStatus(),
                r.getErrorMessage(),
                fmt(r.getStartedAt()),
                fmt(r.getCompletedAt()),
                fmt(r.getCreatedAt()),
                steps
        );
    }

    private WorkflowStepDto toStepDto(WorkflowStep s) {
        return new WorkflowStepDto(
                s.getId(),
                s.getResumeId(),
                s.getWorkflowId(),
                s.getExecutionGroupId(),
                s.getStepOrder(),
                s.getStepKey(),
                s.getStepName(),
                s.getNodeId(),
                s.getStepCategory(),
                s.getStatus(),
                s.getError(),
                s.getDurationMs(),
                fmt(s.getStartedAt()),
                fmt(s.getCompletedAt()),
                fmt(s.getCreatedAt())
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String fmt(java.time.Instant instant) {
        return instant != null ? ISO.format(instant) : null;
    }
}
