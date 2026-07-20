package com.jianflow.admin.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AdminRoleRepository extends JpaRepository<AdminRole, Integer> {

    Optional<AdminRole> findByCode(String code);

    List<AdminRole> findByIdIn(Collection<Integer> ids);

    @Query("SELECT DISTINCT r FROM AdminRole r LEFT JOIN FETCH r.menus WHERE r.id IN :ids")
    List<AdminRole> findByIdInWithMenus(@Param("ids") Collection<Integer> ids);

    @Query("SELECT DISTINCT r FROM AdminRole r LEFT JOIN FETCH r.menus WHERE r.id = :id")
    Optional<AdminRole> findByIdWithMenus(@Param("id") Integer id);

    @Query("SELECT r FROM AdminRole r ORDER BY r.id ASC")
    List<AdminRole> findAllOrderById();
}
