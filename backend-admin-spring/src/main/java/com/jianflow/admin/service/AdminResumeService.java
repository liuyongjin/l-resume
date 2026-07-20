package com.jianflow.admin.service;

import com.jianflow.admin.resume.Resume;
import com.jianflow.admin.resume.ResumeRepository;
import com.jianflow.admin.web.dto.ResumeDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminResumeService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final ResumeRepository resumeRepository;
    private final UsernameResolver usernameResolver;

    public AdminResumeService(ResumeRepository resumeRepository, UsernameResolver usernameResolver) {
        this.resumeRepository = resumeRepository;
        this.usernameResolver = usernameResolver;
    }

    @Transactional(readOnly = true)
    public Page<ResumeDto> list(Integer userId, String q, int page, int size) {
        Page<Resume> result = resumeRepository.search(userId, blankToNull(q), PageRequest.of(page, size));
        Set<Integer> userIds = result.getContent().stream()
                .map(Resume::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, String> names = usernameResolver.resolve(userIds);
        return result.map(r -> toDto(r, names.get(r.getUserId())));
    }

    @Transactional(readOnly = true)
    public ResumeDto get(Integer id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));
        return toDto(resume, usernameResolver.resolveOne(resume.getUserId()));
    }

    private ResumeDto toDto(Resume r, String username) {
        return new ResumeDto(
                r.getId(),
                r.getUserId(),
                username,
                r.getTitle(),
                r.getTemplateId(),
                r.getSource(),
                r.isFavorite(),
                r.getShareToken() != null && !r.getShareToken().isBlank(),
                fmt(r.getCreatedAt()),
                fmt(r.getUpdatedAt())
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String fmt(java.time.Instant instant) {
        return instant != null ? ISO.format(instant) : null;
    }
}
