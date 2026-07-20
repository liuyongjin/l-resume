package com.jianflow.admin.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowStepRepository extends JpaRepository<WorkflowStep, Integer> {

    List<WorkflowStep> findByExecutionGroupIdOrderByStepOrderAscIdAsc(String executionGroupId);
}
