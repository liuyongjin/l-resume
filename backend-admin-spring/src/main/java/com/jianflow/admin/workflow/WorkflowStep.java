package com.jianflow.admin.workflow;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "jf_workflow_step")
public class WorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "resume_id")
    private Integer resumeId;

    @Column(name = "workflow_id")
    private Integer workflowId;

    @Column(name = "execution_group_id", length = 64)
    private String executionGroupId;

    @Column(name = "step_order")
    private Integer stepOrder;

    @Column(name = "step_key", length = 100)
    private String stepKey;

    @Column(name = "step_name", length = 200)
    private String stepName;

    @Column(name = "node_id", length = 100)
    private String nodeId;

    @Column(name = "step_category", length = 50)
    private String stepCategory;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "text")
    private String error;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Integer getId() { return id; }
    public Integer getUserId() { return userId; }
    public Integer getResumeId() { return resumeId; }
    public Integer getWorkflowId() { return workflowId; }
    public String getExecutionGroupId() { return executionGroupId; }
    public Integer getStepOrder() { return stepOrder; }
    public String getStepKey() { return stepKey; }
    public String getStepName() { return stepName; }
    public String getNodeId() { return nodeId; }
    public String getStepCategory() { return stepCategory; }
    public String getStatus() { return status; }
    public String getError() { return error; }
    public Integer getDurationMs() { return durationMs; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
