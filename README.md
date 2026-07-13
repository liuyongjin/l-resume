# 简流 (l-resume)

简历构建与工作流平台 —  monorepo 结构。

## 目录结构

```
l-resume/
├── frontend-web/          # 前台 Web（Nuxt）
├── backend-nest/          # 前台 API（NestJS）
├── backend-agent-python/  # AI Agent 服务（Python :5001）
├── backend-admin-java/    # 管理后台 API + 管理员登录（Spring Boot :8088）
├── frontend-admin/        # 管理后台 Web（React + Vite :5174）
├── frontend-mobile/       # 移动端 App（Expo）
├── docs/auth-admin/       # 管理后台文档
├── scripts/               # 运维脚本
└── pom.xml                # Java 后端父 POM
```

## 快速启动

### 1. 数据库

```bash
cd backend-nest
npm run prisma:push
npm run prisma:seed
```

### 2. 管理 API

```bash
cd backend-admin-java
mvn spring-boot:run
```

### 3. 管理后台

```bash
cd frontend-admin
npm install && npm run dev
```

### 4. 前台 API + Web

```bash
cd backend-nest && npm run start:dev
cd frontend-web && npm run dev
```

### 5. 移动端

```bash
cd frontend-mobile && npm install && npm start
```

### 6. Agent

```bash
cd backend-agent-python
# 见 backend-agent-python/README.md
```

## 端口一览

| 服务 | 端口 |
|------|------|
| frontend-web | 3000 |
| backend-nest | 3001/3002 |
| backend-agent-python | 5001 |
| backend-admin-java | 8088 |
| frontend-admin | 5174 |
| frontend-mobile | 8081 (Expo) |

## 测试账号

| 账号 | 密码 | 用途 |
|------|------|------|
| admin | admin123 | 管理后台 SUPER_ADMIN |
| TestUser / 12345678900 | 123456 | 前台 USER |

## 文档

- [Ubuntu Docker 部署指南](DEPLOY.md)
- [管理后台 JWT](docs/auth-admin/knowledge/jwt-claims.md)
