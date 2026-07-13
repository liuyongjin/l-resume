# JWT Claims（管理后台）

`backend-admin-java` 登录后签发的 access token 示例：

```json
{
  "sub": "admin",
  "iss": "http://localhost:8088",
  "userId": 2,
  "roles": ["SUPER_ADMIN"]
}
```

- **issuer** 默认 `http://localhost:8088`（见 `application.yml` 中 `jianflow.jwt.issuer`）
- **roles** 为数组，Spring Security 映射为 `ROLE_ADMIN` / `ROLE_SUPER_ADMIN`
- 仅 `ADMIN`、`SUPER_ADMIN` 可通过 `POST /auth/login` 登录

前台 `frontend-web` / `frontend-mobile` 仍使用 Nest 自有 JWT（`JWT_SECRET`），与管理后台 token 相互独立。
