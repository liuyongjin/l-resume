#!/usr/bin/env bash
# 一键构建并用 PM2 部署：Agent + Nest + 前端
# 用法见文末 --help，或 deploy/README.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOSYSTEM="$ROOT/deploy/ecosystem.config.cjs"

SKIP_PULL=0
SKIP_INSTALL=0
DO_MIGRATE=0
ONLY=""

print_help() {
  cat <<'EOF'
用法: bash deploy/pm2-deploy.sh [选项]
  或: bash deploy/pm2-ctl.sh deploy [选项]

选项:
  --skip-pull       跳过 git pull
  --skip-install    跳过依赖安装（npm ci/install、pip install）
  --migrate         构建 Nest 时执行 prisma db push
  --only=LIST       只处理指定服务，逗号分隔：agent,nest,web
                    例: --only=nest,web
  -h, --help        显示帮助

示例:
  bash deploy/pm2-ctl.sh deploy
  bash deploy/pm2-ctl.sh deploy --skip-pull --skip-install
  bash deploy/pm2-ctl.sh deploy --only=web --skip-install
  bash deploy/pm2-ctl.sh deploy --migrate
EOF
}

for arg in "$@"; do
  case "$arg" in
    --skip-pull) SKIP_PULL=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    --migrate) DO_MIGRATE=1 ;;
    --only=*) ONLY="${arg#--only=}" ;;
    --only)
      echo "请使用 --only=agent,nest,web" >&2
      exit 1
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "未知参数: $arg" >&2
      print_help >&2
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

if [[ "$SKIP_INSTALL" -eq 1 ]]; then
  echo "==> 跳过依赖安装 (--skip-install)"
fi

# ---------- Agent ----------
if should_build agent; then
  echo "==> 处理 Agent"
  cd "$ROOT/backend-agent-python"
  if [[ ! -d .venv ]]; then
    if [[ "$SKIP_INSTALL" -eq 1 ]]; then
      echo "错误: 无 .venv 且指定了 --skip-install，请先不带该参数部署一次" >&2
      exit 1
    fi
    python3 -m venv .venv
  fi
  if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
    pip install -U pip
    pip install -r requirements.txt
    deactivate
  fi
  if [[ ! -f .env ]]; then
    echo "警告: backend-agent-python/.env 不存在，请先从 .env.example 复制并填写 ZHIPU_API_KEY" >&2
  fi
fi

# ---------- Nest ----------
if should_build nest; then
  echo "==> 构建 Nest"
  cd "$ROOT/backend-nest"
  if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
  elif [[ ! -d node_modules ]]; then
    echo "错误: backend-nest/node_modules 不存在且指定了 --skip-install" >&2
    exit 1
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
  if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
  elif [[ ! -d node_modules ]]; then
    echo "错误: frontend-web/node_modules 不存在且指定了 --skip-install" >&2
    exit 1
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
