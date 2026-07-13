# 约束索引

## 技术栈锁定

| 组件 | 技术 | 版本 |
|------|------|------|
| Admin API | Spring Boot + JWT | 3.2 |
| Admin Web | React + Vite + TypeScript | 18 / 5 |
| 数据库 | PostgreSQL（与 backend-nest 共用） | 14+ |
| JDK | Temurin 17 | 17+ |

## 端口

| 服务 | 端口 |
|------|------|
| admin-api | 8088 |
| admin-web dev | 5174 |
| backend-nest | 3001/3002 |

## 角色

- `USER` — 前台用户（默认）
- `ADMIN` — 管理后台
- `SUPER_ADMIN` — 超级管理员（用户角色管理）

## 不可做

- 管理后台不提供注册页（账号由数据库种子或 Nest 注册产生）
- 不新建独立用户表（共用 `jf_user`）
- 不在 Agent 暴露浏览器 OAuth 流程
