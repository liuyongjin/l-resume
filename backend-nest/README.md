# backend-nest

[English](./README.en.md)

简流前台 API 服务（NestJS + Prisma + PostgreSQL），为 `frontend-web` / `frontend-mobile` 提供认证、简历、模板、工作流与 AI 代理能力。

- 端口：**3001**
- API 前缀：`/api`
- Swagger 文档：http://localhost:3001/api-docs
- Agent 代理：`/api/multiagent/*` → `MULTIAGENT_SERVICE_URL`（默认 `http://localhost:5001`）

## 快速开始

```bash
cd backend-nest
cp .env.example .env
# 编辑 DATABASE_URL、JWT_SECRET、MULTIAGENT_SERVICE_URL
npm install
npm run prisma:init    # push schema + seed
npm run start:dev
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | Token 有效期（默认 `7d`） |
| `PORT` | 服务端口（默认 `3001`） |
| `BASE_URL` | 对外根地址（上传资源等） |
| `MULTIAGENT_SERVICE_URL` | Python Agent 地址 |

大模型列表、QPS、超时、工作流节点默认值见 `config/llm-models.json`（与 Agent 共用）。

## 主要模块

| 模块 | 路径前缀 | 功能 |
|------|---------|------|
| auth | `/api/auth` | 注册、登录、profile、改密、登出 |
| resumes | `/api/resumes` | 简历 CRUD、上传解析、头像、收藏、分享 |
| templates | `/api/templates` | 模板列表与详情 |
| workflows | `/api/workflows` | 工作流 CRUD、执行、版本、health |
| ai | `/api/ai` | AI 优化、检查、改写、匹配、简历对话 |
| multiagent | `/api/multiagent` | 代理至 Python Agent |

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run start:dev` | 开发模式（watch） |
| `npm run build` | 编译 |
| `npm run prisma:push` | 同步表结构 |
| `npm run prisma:seed` | 写入种子数据 |
| `npm run prisma:init` | push + seed |
| `npm run prisma:reset` | 重建库并重新种子 |
| `npm run prisma:studio` | Prisma Studio |

## 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| TestUser / 12345678900 | 123456 | USER |

## 相关文档

- [根 README](../README.md)
- [Agent 服务](../backend-agent-python/README.md)
- [前台 Web](../frontend-web/README.md)
