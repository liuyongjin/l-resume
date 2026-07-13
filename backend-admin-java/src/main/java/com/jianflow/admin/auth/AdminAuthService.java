package com.jianflow.admin.auth;

import com.jianflow.admin.user.User;
import com.jianflow.admin.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class AdminAuthService {

    private static final Set<String> ADMIN_ROLES = Set.of("ADMIN", "SUPER_ADMIN");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final Duration tokenTtl;

    public AdminAuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            @Value("${jianflow.jwt.issuer:http://localhost:8088}") String issuer,
            @Value("${jianflow.jwt.expires-in:2h}") Duration tokenTtl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.tokenTtl = tokenTtl;
    }

    public LoginResult login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByPhone(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "账号已禁用");
        }

        if (!ADMIN_ROLES.contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无管理后台访问权限");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(tokenTtl);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("userId", user.getId())
                .claim("roles", List.of(user.getRole()))
                .build();

        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new LoginResult(accessToken, tokenTtl.toSeconds());
    }

    public record LoginResult(String accessToken, long expiresIn) {}
}
