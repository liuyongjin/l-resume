package com.jianflow.admin.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);

    Optional<User> findByPhone(String phone);

    @Query("SELECT u FROM User u WHERE (:q IS NULL OR :q = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%'))")
    Page<User> search(String q, Pageable pageable);

    long countByRole(String role);
    long countByStatus(String status);
}
