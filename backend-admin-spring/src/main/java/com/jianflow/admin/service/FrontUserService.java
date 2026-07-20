package com.jianflow.admin.service;

import com.jianflow.admin.user.User;
import com.jianflow.admin.user.UserRepository;
import com.jianflow.admin.web.dto.FrontUserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;

@Service
public class FrontUserService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final UserRepository userRepository;

    public FrontUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<FrontUserDto> list(String q, int page, int size) {
        return userRepository.search(q, PageRequest.of(page, size)).map(this::toDto);
    }

    @Transactional
    public FrontUserDto updateStatus(Integer id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(status);
        userRepository.save(user);
        return toDto(user);
    }

    private FrontUserDto toDto(User user) {
        return new FrontUserDto(
                user.getId(),
                user.getUsername(),
                user.getPhone(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt() != null ? ISO.format(user.getCreatedAt()) : null
        );
    }
}
