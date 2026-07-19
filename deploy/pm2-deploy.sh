#!/usr/bin/env bash
# 一键构建并用 PM2 部署：Agent + Nest + 前端
# 用法（在仓库根目录或任意目录）:
#   bash deploy/pm2-deploy.sh
#   bash deploy/pm2-deploy.sh --skip-pull
#   bash deploy/pm2-deploy.sh --migrate          # prisma db push
#   bash deploy/pm2-deploy.sh --only nest,web    # 只构建指定服务
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOSYSTEM="$ROOT/deploy/ecosystem.config.cjs"

SKIP_PULL=0
DO_MIGRATE=0
ONLY=""

for arg in "$@"; do
  case "$arg" in
    --skip-pull) SKIP_PULL=1 ;;
    --migrate) DO_MIGRATE=1 ;;
    --only=*) ONLY="${arg#--only=}" ;;
    --only)
      echo "请使用 --only=agent,nest,web" >&2
      exit 1
      ;;
    -h|--help)
      sed -n '2,8p' "$0"
      exit 0
      ;;
    *)
      echo "未知参数: $arg" >&2
      exit 1
      ;;
  esac
done

should_build() {
  local name="$1"
  if [[ -z "$ONLY" ]]; then
    return 0
  fi
  [[ ",$ONLY," == *",$name,"* ]]
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "缺少命令: $1" >&2
    exit 1
  }
}

need_cmd git
need_cmd node
need_cmd npm
need_cmd pm2

echo "==> 仓库: $ROOT"
cd "$ROOT"

if [[ "$SKIP_PULL" -eq 0 ]]; then
  echo "==> git pull"
  git pull --ff-only
else
  echo "==> 跳过 git pull"
fi

# ---------- Agent ----------
if should_build agent; then
  echo "==> 构建/安装 Agent"
  cd "$ROOT/backend-agent-python"
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install -U pip
  pip install -r requirements.txt
  deactivate
  if [[ ! -f .env ]]; then
    echo "警告: backend-agent-python/.env 不存在，请先从 .env.example 复制并填写 ZHIPU_API_KEY" >&2
  fi
fi

# ---------- Nest ----------
if should_build nest; then
  echo "==> 构建 Nest"
  cd "$ROOT/backend-nest"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npx prisma generate
  if [[ "$DO_MIGRATE" -eq 1 ]]; then
    echo "==> prisma db push"
    npx prisma db push
  fi
  npm run build
  if [[ ! -f dist/main.js ]]; then
    echo "Nest 构建失败: 找不到 dist/main.js" >&2
    exit 1
  fi
  if [[ ! -f .env ]]; then
    echo "警告: backend-nest/.env 不存在" >&2
  fi
fi

# ---------- Web ----------
if should_build web; then
  echo "==> 构建前端"
  cd "$ROOT/frontend-web"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
  if [[ ! -f .output/server/index.mjs ]]; then
    echo "前端构建失败: 找不到 .output/server/index.mjs" >&2
    exit 1
  fi
fi

# ---------- PM2 ----------
echo "==> PM2 启动/重载"
cd "$ROOT"
if pm2 describe l-resume-nest >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM" --update-env
else
  pm2 start "$ECOSYSTEM"
fi

pm2 save
pm2 status

echo ""
echo "部署完成。"
echo "  状态: pm2 status"
echo "  日志: pm2 logs"
echo "  重启: bash deploy/pm2-ctl.sh restart"
echo "  停止: bash deploy/pm2-ctl.sh stop"
