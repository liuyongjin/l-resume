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

# 3. 安装 Node / Python venv / PostgreSQL（略）；Node 依赖统一用 npm
sudo npm i -g pm2

# 4. 数据库初始化（仅第一次）
cd backend-nest && npm ci && npm run prisma:init && cd ../..

# 5. 一键构建并启动（首次不要加 --skip-install）
chmod +x deploy/pm2-deploy.sh deploy/pm2-ctl.sh
bash deploy/pm2-ctl.sh deploy

# 6. 开机自启
bash deploy/pm2-ctl.sh startup
# 按 pm2 打印的提示执行那行 sudo 命令，再:
pm2 save
```

## `pm2-ctl.sh` 子命令

| 命令 | 说明 |
|------|------|
| `start` | 按 ecosystem 启动三个服务 |
| `stop` | 停止三个服务 |
| `restart` | 硬重启三个服务（不构建） |
| `reload` | 平滑重载 ecosystem / env |
| `status` | 查看状态 |
| `logs` | 跟踪日志 |
| `monit` | PM2 监控面板 |
| `deploy` | git pull + 构建 + reload（可带下方选项） |
| `startup` | 配置开机自启提示 |
| `-h` / `--help` | 帮助 |

```bash
bash deploy/pm2-ctl.sh restart
bash deploy/pm2-ctl.sh status
bash deploy/pm2-ctl.sh logs
```

## `deploy` / `pm2-deploy.sh` 选项

默认会：`git pull` → 安装依赖（Agent `pip`、Nest/前端 `npm ci|install`）→ 构建 → `pm2 reload`。

| 参数 | 说明 |
|------|------|
| `--skip-pull` | 跳过 `git pull` |
| `--skip-install` | 跳过依赖安装（Nest/前端的 npm、Agent 的 pip） |
| `--migrate` | Nest 构建时执行 `prisma db push` |
| `--only=agent,nest,web` | 只处理列出的服务（逗号分隔） |
| `-h` / `--help` | 显示帮助 |

参数可组合，例如：

```bash
# 完整部署（装依赖）
bash deploy/pm2-ctl.sh deploy

# 已 pull，只构建+重启，不装依赖（日常最快）
bash deploy/pm2-ctl.sh deploy --skip-pull --skip-install

# 只更新前端，不装依赖
bash deploy/pm2-ctl.sh deploy --only=web --skip-install

# 改了 package.json / requirements.txt 时：不要加 --skip-install
bash deploy/pm2-ctl.sh deploy --skip-pull
```

也可直接：`bash deploy/pm2-deploy.sh [选项]`。

## 进程名

| name | 目录 | 入口 |
|------|------|------|
| `l-resume-agent` | `backend-agent-python` | `.venv` + `src/main.py`（Waitress） |
| `l-resume-nest` | `backend-nest` | `dist/main.js` |
| `l-resume-web` | `frontend-web` | `.output/server/index.mjs` |

默认前端监听 `127.0.0.1:3000`，建议前面再挂 Nginx 做 HTTPS；Agent 保持本机访问，由 Nest 的 `MULTIAGENT_SERVICE_URL=http://127.0.0.1:5001` 调用。

## 注意

- 生产不要用 `npm run start:dev` / `npm run dev`
- 前端与 Nest 依赖均用 `npm ci` / `npm install`，不依赖 pnpm
- `--skip-install` 要求已有 `node_modules` / `.venv`；依赖变更后必须去掉该参数再部署一次
- 部署脚本会 `git pull --ff-only`，本地有未提交改动时请先处理或加 `--skip-pull`
- Nest 的 `start` 脚本含 `free-port`，PM2 场景下跑的是 `dist/main.js`，不会走那条路径
