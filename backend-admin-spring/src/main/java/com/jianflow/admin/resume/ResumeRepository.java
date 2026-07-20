package com.jianflow.admin.resume;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResumeRepository extends JpaRepository<Resume, Integer> {

    @Query("""
            SELECT r FROM Resume r
            WHERE (:userId IS NULL OR r.userId = :userId)
              AND (:q IS NULL OR :q = '' OR LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY r.id DESC
            """)
    Page<Resume> search(@Param("userId") Integer userId, @Param("q") String q, Pageable pageable);
}
