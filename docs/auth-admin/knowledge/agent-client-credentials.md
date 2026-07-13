# Agent 服务间认证（已废弃 SSO 方案）

原方案通过 `backend-auth-java` 的 Client Credentials 获取 service token，**已随 auth-server 移除而废弃**。

当前 Nest 调用 `backend-agent-python` 直接通过 `MULTIAGENT_SERVICE_URL` HTTP 代理，无需 OAuth2 token 交换。

```bash
# backend-nest/.env
MULTIAGENT_SERVICE_URL=http://localhost:5001
```

如需生产环境服务间鉴权，可在 Nest ↔ Agent 层单独增加 API Key 或 mTLS，不在本仓库 SSO 范围内。
