package com.jianflow.admin.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "jf_site_daily_stat")
public class SiteDailyStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "stat_date", nullable = false, unique = true)
    private LocalDate statDate;

    @Column(nullable = false)
    private Long pv = 0L;

    @Column(nullable = false)
    private Long uv = 0L;

    @Column(name = "new_users", nullable = false)
    private Integer newUsers = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Integer getId() {
        return id;
    }

    public LocalDate getStatDate() {
        return statDate;
    }

    public Long getPv() {
        return pv;
    }

    public Long getUv() {
        return uv;
    }

    public Integer getNewUsers() {
        return newUsers;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
