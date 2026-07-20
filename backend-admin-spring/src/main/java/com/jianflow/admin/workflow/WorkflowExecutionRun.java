package com.jianflow.admin.workflow;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "jf_workflow_run")
public class WorkflowExecutionRun {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "workflow_id")
    private Integer workflowId;

    @Column(name = "run_type", nullable = false, length = 20)
    private String runType;

    @Column(name = "idempotency_key", length = 128)
    private String idempotencyKey;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public String getId() { return id; }
    public Integer getUserId() { return userId; }
    public Integer getWorkflowId() { return workflowId; }
    public String getRunType() { return runType; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getStatus() { return status; }
    public String getErrorMessage() { return errorMessage; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
