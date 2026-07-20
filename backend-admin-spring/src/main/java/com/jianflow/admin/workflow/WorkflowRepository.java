package com.jianflow.admin.workflow;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkflowRepository extends JpaRepository<Workflow, Integer> {

    @Query("""
            SELECT w FROM Workflow w
            WHERE (:userId IS NULL OR w.userId = :userId)
              AND (:q IS NULL OR :q = '' OR LOWER(w.name) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY w.id DESC
            """)
    Page<Workflow> search(@Param("userId") Integer userId, @Param("q") String q, Pageable pageable);
}
