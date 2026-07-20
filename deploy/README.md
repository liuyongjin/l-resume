# PM2 部署（Ubuntu 生产）

用 PM2 管理 **Agent / Nest / 前端**。三个服务**各自独立构建并启动**：某一个失败时，前面已成功的服务会继续跑，脚本还会继续尝试后面的服务。

## 首次准备

```bash
cd /opt/l-resume

cp backend-resume-nest/.env.example backend-resume-nest/.env
cp backend-agent-fastapi/.env.example backend-agent-fastapi/.env
# 编辑 DATABASE_URL / JWT_SECRET / ZHIPU_API_KEY / MULTIAGENT_SERVICE_URL 等

sudo npm i -g pm2

cd backend-resume-nest && npm ci && npm run prisma:init && cd ../..

chmod +x deploy/pm2-deploy.sh deploy/pm2-ctl.sh
bash deploy/pm2-ctl.sh deploy          # 首次不要加 --skip-install

bash deploy/pm2-ctl.sh startup
pm2 save
```

## 部署行为

顺序固定为：

1. **Agent** → 装依赖 → `pm2 start/reload l-resume-agent`
2. **Nest** → 装依赖 → prisma → build → `pm2 start/reload l-resume-nest`
3. **Web** → 装依赖 → nuxt build → `pm2 start/reload l-resume-web`

例如 Nest 构建失败时：Agent 若已成功则保持运行；脚本仍会继续尝试 Web。

## `pm2-ctl.sh` 命令

| 命令 | 说明 |
|------|------|
| `deploy [选项]` | 独立构建并启动（可中断容错） |
| `start [agent\|nest\|web...]` | 启动（默认全部） |
| `stop [服务...]` | 停止 |
| `restart [服务...]` | 硬重启（不构建） |
| `reload [服务...]` | 平滑重载 |
| `status` | 查看状态 |
| `logs [服务]` | 日志，例 `logs nest` |
| `monit` | 监控面板 |
| `startup` | 开机自启 |
| `-h` / `--help` | 帮助 |

## `deploy` 选项

| 参数 | 说明 |
|------|------|
| `--skip-pull` | 跳过 `git pull` |
| `--skip-install` | 跳过 npm / pip 安装 |
| `--migrate` | Nest 执行 `prisma db push` |
| `--only=agent,nest,web` | 只处理列出的服务 |
| `-h` / `--help` | 帮助 |

```bash
bash deploy/pm2-ctl.sh deploy
bash deploy/pm2-ctl.sh deploy --skip-pull --skip-install
bash deploy/pm2-ctl.sh deploy --only=nest --skip-pull
bash deploy/pm2-ctl.sh deploy --only=web --skip-install
```

## 怎么查看启动状态

```bash
# 推荐
bash deploy/pm2-ctl.sh status

# 或直接
pm2 status
pm2 list

# 单个服务详情（含重启次数、路径、环境）
pm2 describe l-resume-agent
pm2 describe l-resume-nest
pm2 describe l-resume-web

# 看日志
bash deploy/pm2-ctl.sh logs
bash deploy/pm2-ctl.sh logs nest
pm2 logs l-resume-web --lines 100

# 实时监控面板
bash deploy/pm2-ctl.sh monit
# 或
pm2 monit
```

`pm2 status` 里关注：

| 列 | 含义 |
|----|------|
| `status` | `online` 正常；`errored` / `stopped` 异常 |
| `↺` | 重启次数过多说明在崩溃循环 |
| `cpu` / `mem` | 资源占用 |

健康检查（本机）：

```bash
curl -sS http://127.0.0.1:5001/health
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/api-docs
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

## 进程名

| 简称 | PM2 name | 目录 | 入口 |
|------|----------|------|------|
| `agent` | `l-resume-agent` | `backend-agent-fastapi` | `.venv` + FastAPI `src/main.py` (uvicorn) |
| `nest` | `l-resume-nest` | `backend-resume-nest` | `dist/main.js` |
| `web` | `l-resume-web` | `frontend-resume-nuxt` | `.output/server/index.mjs` |

前端默认监听 `0.0.0.0:3000`（可用 `http://服务器IP:3000` 直接访问）；Agent 仅本机，由 Nest `MULTIAGENT_SERVICE_URL=http://127.0.0.1:5001` 调用。

## 注意

- 生产不要用 `dev` 模式
- Node 依赖统一用 `npm ci` / `npm install`（本仓库仅支持 npm）
- 若目录里残留非 npm 的 `node_modules`（例如含 `.pnpm` 的旧目录），部署脚本会自动清掉后用 npm 重装
- `--skip-install` 要求已有可用的 `node_modules`；依赖变更后不要加该参数
- `git pull --ff-only` 失败会直接中止（此时三个服务都还没动）
