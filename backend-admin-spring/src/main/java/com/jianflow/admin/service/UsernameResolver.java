package com.jianflow.admin.service;

import com.jianflow.admin.user.User;
import com.jianflow.admin.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class UsernameResolver {

    private final UserRepository userRepository;

    public UsernameResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<Integer, String> resolve(Collection<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a, HashMap::new));
    }

    public String resolveOne(Integer userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(User::getUsername).orElse(null);
    }
}
