package com.jianflow.admin.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SiteDailyStatRepository extends JpaRepository<SiteDailyStat, Integer> {

    Optional<SiteDailyStat> findByStatDate(LocalDate statDate);

    List<SiteDailyStat> findByStatDateBetweenOrderByStatDateAsc(LocalDate start, LocalDate end);

    @Query("SELECT COALESCE(SUM(s.pv), 0) FROM SiteDailyStat s")
    long sumTotalPv();

    @Query("SELECT COALESCE(SUM(s.uv), 0) FROM SiteDailyStat s")
    long sumTotalUv();
}
