# Docker 部署（Ubuntu）

完整步骤见项目根目录 **[DEPLOY.md](../DEPLOY.md)**。

## 外挂目录

| 宿主机路径 | 容器 | 说明 |
|-----------|------|------|
| `./data/postgres` | postgres | PostgreSQL 数据 |
| `./data/uploads` | api (Nest) | 头像 / 附件上传 |
| `./data/logs/nest` | api (Nest) | `nest_*.log`、`nest_error_*.log` |
| `./data/logs/agent` | agent (Python) | `multiagent_*.log`、`multiagent_error_*.log`、`multiagent_api_*.log` |

Nest 与 Agent **日志分目录挂载**，互不影响，便于分别备份与 tail。

## 快速启动

```bash
cd /opt/l-resume

# 1. 环境变量
cp docker-compose.env.example .env
cp backend-nest/.env.example backend-nest/.env
cp backend-agent-python/.env.example backend-agent-python/.env
nano .env                          # POSTGRES_PASSWORD、JWT_SECRET
nano backend-agent-python/.env     # ZHIPU_API_KEY

# 2. 创建外挂目录
mkdir -p data/postgres data/uploads data/logs/nest data/logs/agent

# 3. 构建并启动
docker compose up -d --build
docker compose ps
```

## 查看日志

```bash
# 容器标准输出
docker compose logs -f api
docker compose logs -f agent

# 外挂文件（推荐生产排查）
tail -f data/logs/nest/nest_*.log
tail -f data/logs/agent/multiagent_api_*.log
```

## 备份

```bash
# 数据库
docker exec lresume-postgres pg_dump -U lresume l_resume > backup.sql

# 上传与日志目录
tar czf lresume-data-$(date +%F).tar.gz data/
```
