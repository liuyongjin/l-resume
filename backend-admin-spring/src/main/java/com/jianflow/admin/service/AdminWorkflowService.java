package com.jianflow.admin.service;

import com.jianflow.admin.web.dto.WorkflowDto;
import com.jianflow.admin.workflow.Workflow;
import com.jianflow.admin.workflow.WorkflowRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminWorkflowService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final WorkflowRepository workflowRepository;
    private final UsernameResolver usernameResolver;

    public AdminWorkflowService(WorkflowRepository workflowRepository, UsernameResolver usernameResolver) {
        this.workflowRepository = workflowRepository;
        this.usernameResolver = usernameResolver;
    }

    @Transactional(readOnly = true)
    public Page<WorkflowDto> list(Integer userId, String q, int page, int size) {
        Page<Workflow> result = workflowRepository.search(userId, blankToNull(q), PageRequest.of(page, size));
        Set<Integer> userIds = result.getContent().stream()
                .map(Workflow::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, String> names = usernameResolver.resolve(userIds);
        return result.map(w -> toDto(w, names.get(w.getUserId())));
    }

    @Transactional(readOnly = true)
    public WorkflowDto get(Integer id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workflow not found"));
        return toDto(workflow, usernameResolver.resolveOne(workflow.getUserId()));
    }

    private WorkflowDto toDto(Workflow w, String username) {
        return new WorkflowDto(
                w.getId(),
                w.getUserId(),
                username,
                w.getVersion(),
                w.getName(),
                w.getDescription(),
                w.isDefault(),
                w.isActive(),
                fmt(w.getPublishedAt()),
                fmt(w.getCreatedAt()),
                fmt(w.getUpdatedAt())
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String fmt(java.time.Instant instant) {
        return instant != null ? ISO.format(instant) : null;
    }
}
