# 简流 (l-resume) — Ubuntu Docker 部署指南

本文档说明如何在 **Ubuntu 22.04+** 服务器上，使用 **Docker Compose** 部署简流项目。

- 部署方式：Docker（无需手动安装 Node.js / Python / PostgreSQL）
- 推荐目录：`/opt/l-resume`
- 数据持久化：数据库、上传文件、Nest/Agent 日志均外挂到 `./data/`

相关文件：

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | 服务编排 |
| `docker-compose.env.example` | 根目录环境变量模板 |
| `deploy/docker/README.md` | 外挂目录与运维速查 |

---

## 0. 准备

| 项目 | 说明 |
|------|------|
| 服务器 | Ubuntu 22.04 / 24.04，建议 2 核 4G 以上 |
| 开放端口 | `22`（SSH）、`3000`（Web，或后续 Nginx 80/443） |
| 智谱 API Key | 填入 `backend-agent-python/.env` |
| 强密码 | 数据库密码、`JWT_SECRET`（至少 32 位随机字符串） |

**Docker 容器一览：**

| 容器名 | 服务 | 对外端口 |
|--------|------|----------|
| `lresume-postgres` | PostgreSQL 16 | 不对外（仅内网） |
| `lresume-agent` | Python AI Agent | 不对外 |
| `lresume-api` | NestJS API | 不对外 |
| `lresume-web` | Nuxt 前台 | `3000`（可改 `WEB_PORT`） |

---

## 1. SSH 登录服务器

**Windows PowerShell：**

```powershell
ssh root@你的服务器IP
```

**使用密钥：**

```powershell
ssh -i C:\path\to\your-key.pem root@你的服务器IP
```

登录后（可选）：

```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Shanghai
```

---

## 2. 安装 Docker

> **重要：** 请一条一条执行命令，等上一条完成后再执行下一条。不要多条命令粘在同一行。

### 2.1 方式 A：Ubuntu 官方源（最简单）

```bash
sudo apt update
```

```bash
sudo apt install -y docker.io
```

安装成功应看到 `Setting up docker.io ...`。

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker --no-pager
```

```bash
docker --version
```

### 2.2 安装 Docker Compose

Ubuntu 22.04 默认源可能没有 `docker-compose-plugin`，请按顺序尝试：

**尝试 1：**

```bash
sudo apt install -y docker-compose-v2
docker compose version
```

**尝试 2：独立二进制（推荐，最稳定）**

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

若使用独立二进制，后续命令将 `docker compose` 替换为 `docker-compose`（带横杠）。

### 2.3 方式 B：官方一键脚本

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable docker
sudo systemctl start docker
docker --version
docker compose version
```

### 2.4 方式 C：国内阿里云镜像（get.docker.com 失败时）

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker

docker --version
docker compose version
```

> 若为 Ubuntu 24.04，将上面 `jammy` 改为 `noble`。

### 2.5 验证 Docker

```bash
sudo docker run hello-world
```

看到 `Hello from Docker!` 表示安装成功。

### 2.6 Docker 安装故障排查

**现象：`Command 'docker' not found`**

说明 `docker.io` 未安装成功。执行：

```bash
sudo apt install -y docker.io
dpkg -l | grep docker
which docker
```

把完整输出保存以便排查。

**现象：`docker compose` 不存在**

使用 `docker-compose`（带横杠），或按 2.2 安装独立二进制。

**现象：磁盘空间不足**

```bash
df -h
```

**现象：Docker 构建时 `pip install` / `npm ci` DNS 失败（`Temporary failure in name resolution`）**

1. 配置 Docker 使用公共 DNS：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<'EOF'
{
  "dns": ["114.114.114.114", "223.5.5.5", "8.8.8.8"]
}
EOF
sudo systemctl restart docker
```

2. 使用国内源重新构建（项目 Dockerfile 已支持）：

```bash
cd /opt/l-resume
docker compose build --no-cache \
  --build-arg PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
docker compose up -d
```

若仅 agent 失败，也可只重建 agent：

```bash
docker compose build --no-cache agent \
  --build-arg PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
docker compose up -d
```

3. 验证容器内 DNS：

```bash
docker run --rm alpine ping -c 1 pypi.org
```

---

## 3. 上传项目代码

### 3.1 Git 克隆（推荐）

```bash
sudo mkdir -p /opt/l-resume
sudo chown $USER:$USER /opt/l-resume
cd /opt/l-resume

git clone https://你的仓库地址.git .
```

### 3.2 本机 scp 上传

在**本地电脑**执行：

```powershell
scp -r E:\backup_files\l-resume root@2404:8c80:85:8001::16d:/opt/l-resume
```

### 3.3 确认文件齐全

```bash
cd /opt/l-resume
ls docker-compose.yml backend-nest backend-agent-python frontend-web
```

---

## 4. 配置环境变量

### 4.1 根目录 `.env`（Docker Compose 用）

```bash
cd /opt/l-resume
cp docker-compose.env.example .env
nano .env
```

示例：

```env
POSTGRES_USER=lresume
POSTGRES_PASSWORD=你的数据库强密码
POSTGRES_DB=l_resume

JWT_SECRET=至少32位随机字符串
JWT_EXPIRES_IN=7d

WEB_PORT=3000
NEST_LOG_LEVEL=info
AGENT_DEBUG=false
```

### 4.2 Agent API Key

```bash
cp backend-agent-python/.env.example backend-agent-python/.env
nano backend-agent-python/.env
```

必填：

```env
API_HOST=0.0.0.0
API_PORT=5001
API_DEBUG=false
ZHIPU_API_KEY=你的智谱API密钥
```

### 4.3 Nest 配置

```bash
cp backend-nest/.env.example backend-nest/.env
```

`docker-compose.yml` 会覆盖 `DATABASE_URL`、`MULTIAGENT_SERVICE_URL` 等关键项，保留该文件即可。

---

## 5. 创建外挂数据目录

```bash
cd /opt/l-resume
mkdir -p data/postgres data/uploads data/logs/nest data/logs/agent
chmod 700 data/postgres
```

| 宿主机路径 | 用途 |
|-----------|------|
| `data/postgres` | PostgreSQL 数据库文件 |
| `data/uploads` | 头像、简历附件 |
| `data/logs/nest` | Nest 日志（`nest_*.log`） |
| `data/logs/agent` | Agent 日志（`multiagent_*.log`，与 Nest 分开） |

---

## 6. 构建并启动

```bash
cd /opt/l-resume
docker compose up -d --build
```

若使用独立 `docker-compose` 二进制：

```bash
docker-compose up -d --build
```

首次构建约 5–15 分钟。

查看状态：

```bash
docker compose ps
```

四个容器均应为 `running`：

- `lresume-postgres`
- `lresume-agent`
- `lresume-api`
- `lresume-web`

---

## 7. 验证服务

```bash
# Agent
docker exec lresume-agent wget -qO- http://127.0.0.1:5001/health

# API
docker exec lresume-api wget -qO- http://127.0.0.1:3001/api/workflows/health

# Web
curl -I http://127.0.0.1:3000
```

浏览器访问：

```
http://你的服务器IP:3000
```

**测试账号**（首次启动自动 seed）：

| 账号 | 密码 | 用途 |
|------|------|------|
| TestUser / 12345678900 | 123456 | 前台 |
| admin | admin123 | 管理后台（需单独部署 Java 管理端） |

---

## 8. 防火墙与安全组

**服务器 ufw：**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

**云厂商控制台：** 在安全组中放行 `3000`（或 80/443）。

---

## 9. 查看日志

```bash
cd /opt/l-resume

# 容器标准输出
docker compose logs -f api
docker compose logs -f agent
docker compose logs -f web

# 外挂日志文件（推荐）
tail -f data/logs/nest/nest_*.log
tail -f data/logs/agent/multiagent_api_*.log
```

---

## 10. 常用运维命令

```bash
cd /opt/l-resume

# 停止
docker compose down

# 重启
docker compose restart

# 更新代码后重新部署
git pull
docker compose up -d --build

# 只看某个服务日志
docker compose logs -f api --tail=100
```

---

## 11. 备份与恢复

### 11.1 数据库备份

```bash
docker exec lresume-postgres pg_dump -U lresume l_resume > backup_$(date +%F).sql
```

### 11.2 恢复数据库

```bash
cat backup.sql | docker exec -i lresume-postgres psql -U lresume -d l_resume
```

### 11.3 备份全部外挂数据

```bash
cd /opt/l-resume
tar czf lresume-data-$(date +%F).tar.gz data/
```

包含：数据库、上传文件、Nest/Agent 日志。

---

## 12.（可选）Nginx 反向代理 + HTTPS

### 12.1 安装 Nginx

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/lresume
```

```nginx
server {
    listen 80;
    server_name resume.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lresume /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 80
sudo ufw allow 443
```

### 12.2 HTTPS（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d resume.example.com
```

---

## 13. 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| `set POSTGRES_PASSWORD in .env` | 根目录 `.env` 未配置 | `cp docker-compose.env.example .env` 并填写 |
| `set JWT_SECRET in .env` | JWT 未配置 | 在 `.env` 中设置至少 32 位随机字符串 |
| `Command 'docker' not found` | Docker 未安装 | 见第 2 节，单独执行 `apt install docker.io` |
| `docker compose` 不存在 | Compose 插件未装 | 用 `docker-compose` 或 2.2 节独立二进制 |
| 构建 npm 超时 | 网络慢 | 多等或重试；Dockerfile 已默认 npmmirror |
| `pip install` DNS 失败 / `Temporary failure in name resolution` | 服务器或 Docker 内 DNS 不可用 | 见 DEPLOY.md「Docker 构建 DNS」；配置 Docker DNS + 国内 pip 源后重建 |
| AI 功能不可用 | API Key 无效 | 检查 `backend-agent-python/.env` |
| 浏览器无法访问 3000 | 防火墙/安全组 | 检查 ufw 与云安全组 |
| 容器反复重启 | 数据库或配置错误 | `docker compose logs api` 查看详情 |

---

## 14. 部署流程速查

```
1. SSH 登录 Ubuntu
2. 安装 Docker + Compose（第 2 节）
3. 上传代码到 /opt/l-resume
4. cp docker-compose.env.example .env，填写密码与 JWT
5. cp backend-agent-python/.env.example，填写 ZHIPU_API_KEY
6. mkdir -p data/postgres data/uploads data/logs/nest data/logs/agent
7. docker compose up -d --build
8. 浏览器访问 http://服务器IP:3000
9. （可选）Nginx + HTTPS
```

---

## 15. 不部署 Docker 时的手动安装

若不用 Docker，需自行安装 Node.js 20+、PostgreSQL、Python 3.10+，参见项目 `README.md` 中的「快速启动」章节。生产环境推荐使用本文档的 Docker 方案。
