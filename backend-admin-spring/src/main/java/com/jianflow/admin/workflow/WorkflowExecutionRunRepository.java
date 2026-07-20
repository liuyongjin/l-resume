package com.jianflow.admin.workflow;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkflowExecutionRunRepository extends JpaRepository<WorkflowExecutionRun, String> {

    @Query("""
            SELECT r FROM WorkflowExecutionRun r
            WHERE (:userId IS NULL OR r.userId = :userId)
              AND (:workflowId IS NULL OR r.workflowId = :workflowId)
              AND (:status IS NULL OR :status = '' OR r.status = :status)
              AND (:runType IS NULL OR :runType = '' OR r.runType = :runType)
              AND (:q IS NULL OR :q = '' OR LOWER(r.id) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY r.startedAt DESC
            """)
    Page<WorkflowExecutionRun> search(
            @Param("userId") Integer userId,
            @Param("workflowId") Integer workflowId,
            @Param("status") String status,
            @Param("runType") String runType,
            @Param("q") String q,
            Pageable pageable);
}
