# frontend-admin-react

简流管理后台 Web（React + Vite + RBAC），**全部页面直连真实 Java API**（无 mock）。

- 访问地址：http://127.0.0.1:5174
- 登录：`POST /auth/login`（无注册页）
- 默认账号：`admin` / `123456`
- 开发代理：Vite 将 `/auth`、`/admin` 转发到 `http://127.0.0.1:8088`

## 启动

```bash
cd frontend-admin-react
cp .env.example .env   # 若尚无 .env；默认留空走代理
npm install
npm run dev
```

需先启动 `backend-admin-spring`（端口 8088）与 PostgreSQL。

## 联调测试

```bash
# 1) 直连 Java API 的集成测试（无 mock）
npm run test:api

# 2) Playwright 前端冒烟（经 Vite 代理打真实后端）
npx playwright install chromium   # 首次需要
npm run test:e2e

# 或一次跑完
npm run test:integration
```

环境变量（可选）：

| 变量 | 说明 | 默认 |
|------|------|------|
| `ADMIN_API_URL` | API 测试目标 | `http://127.0.0.1:8088` |
| `ADMIN_WEB_URL` | E2E 前端地址 | `http://127.0.0.1:5174` |
| `ADMIN_USER` / `ADMIN_PASS` | 测试账号 | `admin` / `123456` |

## 环境变量（前端）

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_ADMIN_API_URL` | 管理后台 API 根地址；**留空**则同源 + Vite 代理 | （空）或 `http://127.0.0.1:8088` |

## 功能概览

- 登录后拉取 `GET /admin/me`（username / roles / permissions / menus）
- 侧边栏由 menus 树渲染（directory + menu）
- 路由守卫：`ProtectedRoute`（需登录）、`PermissionRoute`（需页面权限）
- 按钮级权限：无对应 permission 时隐藏操作
- 页面：仪表盘、前台用户、简历、工作流、执行日志、后台用户、角色、菜单

已有环境可增量执行 `backend-admin-spring/sql/patch-biz-menus.sql` 补齐业务数据菜单。
