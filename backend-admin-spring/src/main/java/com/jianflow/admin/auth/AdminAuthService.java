package com.jianflow.admin.auth;

import com.jianflow.admin.domain.AdminRole;
import com.jianflow.admin.domain.AdminUser;
import com.jianflow.admin.domain.AdminMenuRepository;
import com.jianflow.admin.domain.AdminUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final AdminMenuRepository adminMenuRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final Duration tokenTtl;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            AdminMenuRepository adminMenuRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            @Value("${jianflow.jwt.issuer:http://localhost:8088}") String issuer,
            @Value("${jianflow.jwt.expires-in:2h}") Duration tokenTtl) {
        this.adminUserRepository = adminUserRepository;
        this.adminMenuRepository = adminMenuRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.tokenTtl = tokenTtl;
    }

    @Transactional(readOnly = true)
    public LoginResult login(String username, String password) {
        AdminUser user = adminUserRepository.findByUsernameWithRoles(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "账号已禁用");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }

        List<String> roles = user.getRoles().stream()
                .filter(AdminRole::isActive)
                .map(AdminRole::getCode)
                .sorted()
                .toList();

        if (roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "未分配有效角色");
        }

        List<String> permissions = new ArrayList<>(adminMenuRepository.findPermissionCodesByUserId(user.getId()));
        permissions.sort(Comparator.naturalOrder());

        Instant now = Instant.now();
        Instant expiresAt = now.plus(tokenTtl);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("userId", user.getId())
                .claim("roles", roles)
                .claim("permissions", permissions)
                .build();

        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
        )).getTokenValue();
        return new LoginResult(accessToken, tokenTtl.toSeconds());
    }

    public record LoginResult(String accessToken, long expiresIn) {}
}
