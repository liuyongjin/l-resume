# SSO Platform Delivery Log

## 2026-07-09 — S0–S8 完成

### S0 文档
- `platform/INDEX.md`、约束、知识库、里程碑

### S1 数据库
- Prisma `User.role` / `User.status`
- `AuditLog` 表
- init.sql 种子 `admin` / SUPER_ADMIN

### S2 auth-server (:9000)
- Spring Authorization Server
- OAuth2 客户端：admin-web、nest-api、mobile-app
- JWT claims: userId, roles
- 登录页 Thymeleaf

### S3 admin-api (:8088)
- OAuth2 Resource Server (issuer JWKS)
- `/admin/stats`, `/admin/users`, `/admin/audit-logs`, `/admin/me`
- 角色变更、状态变更 + 审计

### S4 admin-web (:5174)
- React + Vite + OIDC PKCE
- Dashboard、用户管理、审计日志

### S5 Nest 集成
- `OAuthTokenService` + JWKS 校验
- 保留 legacy JWT 兼容

### S6 Agent
- nest-api Client Credentials 文档
- `knowledge/agent-client-credentials.md`

### S7 管理功能
- 用户列表/搜索、角色/状态 PATCH
- 审计日志 API

### S8 E2E
- `scripts/test-sso.ps1` 验证通过：
  - admin PKCE 登录 → token → `/admin/stats` 200
  - nest-api client_credentials 获取 service token

### 启动命令
```bash
cd platform/auth-server && mvn spring-boot:run
cd platform/admin-api && mvn spring-boot:run
cd platform/admin-web && npm run dev
```

### 测试账号
- admin / admin123 (SUPER_ADMIN)
- TestUser / 123456 (USER)
