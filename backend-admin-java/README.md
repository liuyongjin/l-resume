# backend-admin-java

简流管理后台 REST API（Spring Boot），含管理员登录与 JWT 签发。

- 端口：**8088**
- 登录：`POST /auth/login`（仅 ADMIN / SUPER_ADMIN，无注册）
- 业务前缀：`/admin/**`

## 启动

```bash
mvn spring-boot:run
```

## 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 管理员登录，返回 JWT |
| GET | /admin/stats | 仪表盘统计 |
| GET | /admin/users | 用户列表 |
| PATCH | /admin/users/:id/role | 修改角色（SUPER_ADMIN） |
| PATCH | /admin/users/:id/status | 修改状态 |
| GET | /admin/me | 当前登录用户 |

`frontend-admin` 登录后携带本服务签发的 Bearer Token 访问 `/admin/**`。

## 配置

`application.yml` 中 `jianflow.jwt.secret` 用于 HS256 签名，生产环境务必修改。
