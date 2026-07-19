# PM2 部署（Ubuntu 生产）

用 PM2 管理 **Agent + Nest + 前端**，并提供一键构建部署脚本。

## 首次准备

```bash
# 1. 代码放到服务器，例如 /opt/l-resume
cd /opt/l-resume

# 2. 配置环境变量
cp backend-nest/.env.example backend-nest/.env
cp backend-agent-python/.env.example backend-agent-python/.env
# 编辑 DATABASE_URL / JWT_SECRET / ZHIPU_API_KEY / MULTIAGENT_SERVICE_URL 等

# 3. 安装 Node / pnpm / Python venv / PostgreSQL（略）
sudo npm i -g pm2

# 4. 数据库初始化（仅第一次）
cd backend-nest && npm ci && npm run prisma:init && cd ../..

# 5. 一键构建并启动
chmod +x deploy/pm2-deploy.sh deploy/pm2-ctl.sh
bash deploy/pm2-ctl.sh deploy

# 6. 开机自启
bash deploy/pm2-ctl.sh startup
# 按 pm2 打印的提示执行那行 sudo 命令，再:
pm2 save
```

## 日常一键命令

| 操作 | 命令 |
|------|------|
| 构建 + 部署 | `bash deploy/pm2-ctl.sh deploy` |
| 跳过 git pull | `bash deploy/pm2-ctl.sh deploy --skip-pull` |
| 顺带同步库结构 | `bash deploy/pm2-ctl.sh deploy --migrate` |
| 只构建部分 | `bash deploy/pm2-ctl.sh deploy --only=nest,web` |
| 启动 | `bash deploy/pm2-ctl.sh start` |
| 停止 / 暂停 | `bash deploy/pm2-ctl.sh stop` |
| 重启 | `bash deploy/pm2-ctl.sh restart` |
| 状态 | `bash deploy/pm2-ctl.sh status` |
| 日志 | `bash deploy/pm2-ctl.sh logs` |
| 监控面板 | `bash deploy/pm2-ctl.sh monit` |

也可直接：

```bash
bash deploy/pm2-deploy.sh
pm2 status
pm2 logs
```

## 进程名

| name | 目录 | 入口 |
|------|------|------|
| `l-resume-agent` | `backend-agent-python` | `.venv` + `src/main.py`（Waitress） |
| `l-resume-nest` | `backend-nest` | `dist/main.js` |
| `l-resume-web` | `frontend-web` | `.output/server/index.mjs` |

默认前端监听 `127.0.0.1:3000`，建议前面再挂 Nginx 做 HTTPS；Agent 保持本机访问，由 Nest 的 `MULTIAGENT_SERVICE_URL=http://127.0.0.1:5001` 调用。

## 注意

- 生产不要用 `npm run start:dev` / `pnpm run dev`
- 部署脚本会 `git pull --ff-only`，本地有未提交改动时请先处理或加 `--skip-pull`
- Nest 的 `start` 脚本含 `free-port`，PM2 场景下跑的是 `dist/main.js`，不会走那条路径
