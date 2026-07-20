# backend-admin-spring

简流管理后台 REST API（Spring Boot + RBAC），独立于前台 `jf_user` 账号体系。

- 端口：**8088**
- 登录：`POST /auth/login`（校验 `jf_admin_user`）
- 业务前缀：`/admin/**`（需 Bearer JWT）
- CORS：`http://localhost:5174`

## 数据库初始化

共用 PostgreSQL 库 `l_resume`。先确保 Nest/Prisma 已建好业务表（如 `jf_user`、`jf_resume`），再执行管理后台 SQL：

```bash
psql -U postgres -d l_resume -f backend-admin-spring/sql/init-admin.sql
```

该脚本会创建 RBAC 表并写入种子数据（角色、菜单、示例 PV/UV）。

## 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | 123456 | SUPER_ADMIN |

密码为 bcrypt（`$2a$...`），由 `BCryptPasswordEncoder` 校验。

## 启动

```bash
# 在本模块目录启动（不要用仓库根目录 mvn -pl … spring-boot:run）
cd backend-admin-spring
mvn spring-boot:run
```

也可用 Prisma 执行初始化 SQL（无 psql 时）：

```bash
cd backend-resume-nest
npx prisma db execute --file ../backend-admin-spring/sql/init-admin.sql --schema prisma/schema.prisma
```

配置见 `src/main/resources/application.yml`（数据源、`jianflow.jwt.secret`）。`ddl-auto` 为 `validate`，表结构以 SQL 为准。

## 主要端点

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /auth/login | 公开 | 管理员登录，JWT 含 `userId` / `roles` / `permissions` |
| GET | /admin/me | 已登录 | 当前用户、角色、权限、可见菜单树 |
| GET | /admin/stats | 已登录 | 用户/简历数与站点 PV·UV |
| GET | /admin/front-users | `front-user:list` | 前台用户列表 |
| PATCH | /admin/front-users/:id/status | `front-user:status` | 启停前台用户 |
| GET | /admin/resumes | `resume:list` | 全部前台用户简历 |
| GET | /admin/workflows | `workflow:list` | 全部前台用户工作流 |
| GET | /admin/workflow-runs | `workflow-run:list` | 工作流执行运行记录 |
| GET | /admin/workflow-runs/:id | `workflow-run:list` | 运行详情 + 步骤日志 |
| GET/POST/PATCH | /admin/admin-users… | `admin-user:*` | 后台用户 |
| GET/PATCH/PUT | /admin/roles… | `role:*` | 角色与菜单分配 |
| GET/PATCH | /admin/menus… | `menu:*` | 菜单树 |

`frontend-admin-react` 登录后携带本服务签发的 Bearer Token 访问 `/admin/**`。
