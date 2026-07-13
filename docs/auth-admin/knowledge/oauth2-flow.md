# OAuth2 授权码 + PKCE（已废弃）

原管理后台通过 `backend-auth-java` 的 OIDC PKCE 流程登录，**已移除**。

当前流程：

1. 用户在 `frontend-admin` `/login` 输入用户名/密码
2. `POST http://localhost:8088/auth/login`
3. 返回 JWT，后续请求 `Authorization: Bearer <token>` 访问 `/admin/**`

见 [jwt-claims.md](./jwt-claims.md)。
