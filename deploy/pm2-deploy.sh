#!/usr/bin/env bash
# 一键构建并用 PM2 部署：Agent / Nest / 前端 彼此独立
# 某个服务失败时，已成功的服务仍会启动；脚本继续处理后续服务
# 用法见 --help 或 deploy/README.md
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOSYSTEM="$ROOT/deploy/ecosystem.config.cjs"

SKIP_PULL=0
SKIP_INSTALL=0
DO_MIGRATE=0
ONLY=""

# 结果记录：ok / fail / skip
RESULT_AGENT="skip"
RESULT_NEST="skip"
RESULT_WEB="skip"

print_help() {
  cat <<'EOF'
用法: bash deploy/pm2-deploy.sh [选项]
  或: bash deploy/pm2-ctl.sh deploy [选项]

流程（可中断容错）:
  1) Agent  安装依赖 → 启动/重载 PM2
  2) Nest   安装依赖 → prisma → build → 启动/重载 PM2
  3) Web    安装依赖 → nuxt build → 启动/重载 PM2
  中间某步失败不影响已成功启动的服务，脚本会继续后面的服务。

选项:
  --skip-pull       跳过 git pull
  --skip-install    跳过依赖安装（npm / pip）
  --migrate         Nest 构建时执行 prisma db push
  --only=LIST       只处理指定服务：agent,nest,web
  -h, --help        显示帮助

示例:
  bash deploy/pm2-ctl.sh deploy
  bash deploy/pm2-ctl.sh deploy --skip-pull --skip-install
  bash deploy/pm2-ctl.sh deploy --only=agent
  bash deploy/pm2-ctl.sh deploy --only=nest,web --skip-install

查看状态:
  bash deploy/pm2-ctl.sh status
  pm2 status
  pm2 logs
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

# 若残留非 npm 的 node_modules（旧目录含 .pnpm 等），npm 会报 Cannot read properties of null (reading 'matches')
has_foreign_node_modules() {
  [[ -d node_modules/.pnpm ]] || [[ -f node_modules/.modules.yaml ]] || [[ -d node_modules/.ignored ]]
}

clean_foreign_node_modules() {
  if has_foreign_node_modules; then
    echo "    检测到非 npm 风格 node_modules，清理后改用 npm 安装"
    rm -rf node_modules
  fi
}

run_local_bin() {
  local bin="$1"
  shift
  if [[ ! -x "node_modules/.bin/$bin" ]]; then
    echo "错误: 找不到 node_modules/.bin/$bin（请去掉 --skip-install 重试）" >&2
    return 1
  fi
  "node_modules/.bin/$bin" "$@"
}

npm_install_deps() {
  clean_foreign_node_modules
  if [[ -f package-lock.json ]]; then
    npm ci --no-fund --no-audit
  else
    npm install --no-fund --no-audit
  fi
}

# 单独启动/重载某一个 PM2 应用（不影响其他进程）
pm2_start_or_reload() {
  local name="$1"
  cd "$ROOT"
  if pm2 describe "$name" >/dev/null 2>&1; then
    echo "    PM2 reload $name"
    pm2 reload "$ECOSYSTEM" --only "$name" --update-env
  else
    echo "    PM2 start $name"
    pm2 start "$ECOSYSTEM" --only "$name"
  fi
}

# ---------- Agent ----------
deploy_agent() {
  echo ""
  echo "======== [1/3] Agent ========"
  cd "$ROOT/backend-agent-python"

  if [[ ! -d .venv ]]; then
    if [[ "$SKIP_INSTALL" -eq 1 ]]; then
      echo "错误: 无 .venv 且指定了 --skip-install"
      return 1
    fi
    python3 -m venv .venv || return 1
  fi

  if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
    pip install -U pip || { deactivate; return 1; }
    pip install -r requirements.txt || { deactivate; return 1; }
    deactivate
  fi

  if [[ ! -f .env ]]; then
    echo "警告: backend-agent-python/.env 不存在，请从 .env.example 复制"
  fi

  pm2_start_or_reload l-resume-agent || return 1
  echo "Agent 部署成功"
  return 0
}

# ---------- Nest ----------
deploy_nest() {
  echo ""
  echo "======== [2/3] Nest ========"
  cd "$ROOT/backend-resume-nest"

  if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    npm_install_deps || return 1
  else
    if [[ ! -d node_modules ]]; then
      echo "错误: node_modules 不存在且指定了 --skip-install"
      return 1
    fi
    if has_foreign_node_modules; then
      echo "错误: node_modules 不是 npm 风格，请去掉 --skip-install"
      return 1
    fi
  fi

  run_local_bin prisma generate || return 1
  if [[ "$DO_MIGRATE" -eq 1 ]]; then
    echo "    prisma db push"
    run_local_bin prisma db push || return 1
  fi
  run_local_bin nest build || return 1

  if [[ ! -f dist/main.js ]]; then
    echo "错误: 找不到 dist/main.js"
    return 1
  fi
  if [[ ! -f .env ]]; then
    echo "警告: backend-resume-nest/.env 不存在"
  fi

  pm2_start_or_reload l-resume-nest || return 1
  echo "Nest 部署成功"
  return 0
}

# ---------- Web ----------
deploy_web() {
  echo ""
  echo "======== [3/3] Web ========"
  cd "$ROOT/frontend-resume-nuxt"

  if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    npm_install_deps || return 1
  else
    if [[ ! -d node_modules ]]; then
      echo "错误: node_modules 不存在且指定了 --skip-install"
      return 1
    fi
    if has_foreign_node_modules; then
      echo "错误: node_modules 不是 npm 风格，请去掉 --skip-install"
      return 1
    fi
  fi

  run_local_bin nuxt build || return 1
  if [[ ! -f .output/server/index.mjs ]]; then
    echo "错误: 找不到 .output/server/index.mjs"
    return 1
  fi

  pm2_start_or_reload l-resume-web || return 1
  echo "Web 部署成功"
  return 0
}

# ---------- main ----------
need_cmd git
need_cmd node
need_cmd npm
need_cmd pm2

echo "==> 仓库: $ROOT"
cd "$ROOT"

if [[ "$SKIP_PULL" -eq 0 ]]; then
  echo "==> git pull"
  if ! git pull --ff-only; then
    echo "错误: git pull 失败，已中止（未改动任何服务）" >&2
    exit 1
  fi
else
  echo "==> 跳过 git pull"
fi

if [[ "$SKIP_INSTALL" -eq 1 ]]; then
  echo "==> 跳过依赖安装 (--skip-install)"
fi

FAILED=0

if should_build agent; then
  if deploy_agent; then
    RESULT_AGENT="ok"
  else
    RESULT_AGENT="fail"
    FAILED=1
    echo "!!!!!!!! Agent 失败，继续后续服务 !!!!!!!!"
  fi
fi

if should_build nest; then
  if deploy_nest; then
    RESULT_NEST="ok"
  else
    RESULT_NEST="fail"
    FAILED=1
    echo "!!!!!!!! Nest 失败，继续后续服务 !!!!!!!!"
  fi
fi

if should_build web; then
  if deploy_web; then
    RESULT_WEB="ok"
  else
    RESULT_WEB="fail"
    FAILED=1
    echo "!!!!!!!! Web 失败 !!!!!!!!"
  fi
fi

cd "$ROOT"
pm2 save >/dev/null 2>&1 || true

echo ""
echo "======== 部署结果 ========"
printf "  Agent (l-resume-agent): %s\n" "$RESULT_AGENT"
printf "  Nest  (l-resume-nest):  %s\n" "$RESULT_NEST"
printf "  Web   (l-resume-web):   %s\n" "$RESULT_WEB"
echo ""
echo "======== 当前 PM2 状态 ========"
pm2 status
echo ""
echo "查看状态/日志:"
echo "  bash deploy/pm2-ctl.sh status"
echo "  bash deploy/pm2-ctl.sh logs"
echo "  pm2 status"
echo "  pm2 logs l-resume-agent"
echo "  pm2 logs l-resume-nest"
echo "  pm2 logs l-resume-web"
echo "  pm2 describe l-resume-nest"
echo ""

if [[ "$FAILED" -ne 0 ]]; then
  echo "部分服务失败（已启动的服务不受影响）。可单独重试，例如:"
  echo "  bash deploy/pm2-ctl.sh deploy --only=nest --skip-pull"
  exit 1
fi

echo "全部选中服务部署成功。"
exit 0
