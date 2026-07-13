# frontend-admin

简流管理后台 Web（React + Vite）。

- 端口：**5174**
- 登录：表单提交至 `backend-admin-java` 的 `POST /auth/login`（无注册页）

## 启动

```bash
npm install
npm run dev
```

## 环境变量

```
VITE_ADMIN_API_URL=http://localhost:8088
```

## 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | SUPER_ADMIN |

需先启动 `backend-admin-java` 与 PostgreSQL。
