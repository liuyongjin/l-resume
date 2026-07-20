package com.jianflow.admin.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AdminUserRepository extends JpaRepository<AdminUser, Integer> {

    Optional<AdminUser> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("SELECT DISTINCT u FROM AdminUser u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<AdminUser> findByUsernameWithRoles(@Param("username") String username);

    @Query("SELECT DISTINCT u FROM AdminUser u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<AdminUser> findByIdWithRoles(@Param("id") Integer id);

    @Query("""
            SELECT u FROM AdminUser u
            WHERE (:q IS NULL OR :q = ''
                OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<AdminUser> search(@Param("q") String q, Pageable pageable);
}
