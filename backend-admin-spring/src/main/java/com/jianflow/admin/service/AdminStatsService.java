package com.jianflow.admin.service;

import com.jianflow.admin.domain.SiteDailyStat;
import com.jianflow.admin.domain.SiteDailyStatRepository;
import com.jianflow.admin.resume.ResumeRepository;
import com.jianflow.admin.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminStatsService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final SiteDailyStatRepository siteDailyStatRepository;

    public AdminStatsService(
            UserRepository userRepository,
            ResumeRepository resumeRepository,
            SiteDailyStatRepository siteDailyStatRepository) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.siteDailyStatRepository = siteDailyStatRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);

        SiteDailyStat todayStat = siteDailyStatRepository.findByStatDate(today).orElse(null);
        long todayPv = todayStat != null ? todayStat.getPv() : 0L;
        long todayUv = todayStat != null ? todayStat.getUv() : 0L;

        List<SiteDailyStat> last7 = siteDailyStatRepository.findByStatDateBetweenOrderByStatDateAsc(start, today);
        List<Map<String, Object>> last7Days = new ArrayList<>();
        for (SiteDailyStat row : last7) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("date", row.getStatDate().toString());
            item.put("pv", row.getPv());
            item.put("uv", row.getUv());
            item.put("newUsers", row.getNewUsers());
            last7Days.add(item);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("activeUsers", userRepository.countByStatus("active"));
        stats.put("resumeCount", resumeRepository.count());
        stats.put("todayPv", todayPv);
        stats.put("todayUv", todayUv);
        stats.put("totalPv", siteDailyStatRepository.sumTotalPv());
        stats.put("totalUv", siteDailyStatRepository.sumTotalUv());
        stats.put("last7Days", last7Days);
        return stats;
    }
}
