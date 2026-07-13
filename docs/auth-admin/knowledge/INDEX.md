# 认证与管理知识库

| 文件 | 内容 |
|------|------|
| [jwt-claims.md](./jwt-claims.md) | 管理后台 JWT Claims |

## 服务对应

| 目录 | 角色 | 端口 |
|------|------|------|
| backend-admin-java | 管理 API + 登录 | 8088 |
| frontend-admin | 管理 Web | 5174 |
| backend-nest | 前台 API | 3001/3002 |
| backend-agent-python | AI Agent | 5001 |
| frontend-web | 前台 Web | 3000 |
| frontend-mobile | 移动端 | 8081 |

## 登录方式

| 客户端 | 登录入口 |
|--------|----------|
| frontend-admin | `POST /auth/login`（表单，无注册） |
| frontend-web / frontend-mobile | Nest `POST /api/auth/login` 或 register |
