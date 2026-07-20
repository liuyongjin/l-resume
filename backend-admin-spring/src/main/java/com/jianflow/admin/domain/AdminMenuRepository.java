package com.jianflow.admin.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AdminMenuRepository extends JpaRepository<AdminMenu, Integer> {

    List<AdminMenu> findByIdIn(Collection<Integer> ids);

    @Query("SELECT m FROM AdminMenu m ORDER BY m.sortOrder ASC, m.id ASC")
    List<AdminMenu> findAllOrdered();

    @Query(value = """
            SELECT DISTINCT m.permission
            FROM jf_admin_menu m
            INNER JOIN jf_admin_role_menu rm ON rm.menu_id = m.id
            INNER JOIN jf_admin_user_role ur ON ur.role_id = rm.role_id
            INNER JOIN jf_admin_role r ON r.id = ur.role_id
            WHERE ur.user_id = :userId
              AND r.status = 'active'
              AND m.status = 'active'
              AND m.permission IS NOT NULL
              AND TRIM(m.permission) <> ''
            """, nativeQuery = true)
    List<String> findPermissionCodesByUserId(@Param("userId") Integer userId);

    @Query(value = """
            SELECT DISTINCT m.*
            FROM jf_admin_menu m
            INNER JOIN jf_admin_role_menu rm ON rm.menu_id = m.id
            INNER JOIN jf_admin_user_role ur ON ur.role_id = rm.role_id
            INNER JOIN jf_admin_role r ON r.id = ur.role_id
            WHERE ur.user_id = :userId
              AND r.status = 'active'
              AND m.status = 'active'
              AND m.visible = TRUE
              AND m.type IN ('directory', 'menu')
            ORDER BY m.sort_order ASC, m.id ASC
            """, nativeQuery = true)
    List<AdminMenu> findVisibleNavMenusByUserId(@Param("userId") Integer userId);
}
