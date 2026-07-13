# SSO & Admin 里程碑

| ID | 任务 | 状态 |
|----|------|------|
| S0 | Harness 文档、约束、知识库 | 🟢 |
| S1 | User 表 role/status 迁移 + 种子 ADMIN | 🟢 |
| S2 | auth-server Spring Authorization Server | 🟢 |
| S3 | admin-api Resource Server + 基础端点 | 🟢 |
| S4 | admin-web React OIDC 登录 + 布局 | 🟢 |
| S5 | Nest OAuth2 Resource Server (JWKS) | 🟢 |
| S6 | Agent Client Credentials 文档与配置 | 🟢 |
| S7 | 用户管理、统计、审计日志 | 🟢 |
| S8 | E2E 验证 + delivery-log | 🟢 |

## 验收

- [x] admin SSO 登录 → admin-api 200
- [x] Maven 构建通过
- [x] admin-web 构建通过
- [x] `scripts/test-sso.ps1` E2E
