#!/usr/bin/env bash
# PM2 一键启停 / 重启 / 日志 / 部署（支持按服务操作）
# 用法: bash deploy/pm2-ctl.sh <command> [args]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOSYSTEM="$ROOT/deploy/ecosystem.config.cjs"
APPS=(l-resume-agent l-resume-nest l-resume-web)

resolve_apps() {
  # 无参数 → 全部；可传 agent|nest|web 或 PM2 全名
  if [[ $# -eq 0 ]]; then
    echo "${APPS[@]}"
    return
  fi
  local out=()
  local a
  for a in "$@"; do
    case "$a" in
      agent|l-resume-agent) out+=(l-resume-agent) ;;
      nest|l-resume-nest) out+=(l-resume-nest) ;;
      web|l-resume-web) out+=(l-resume-web) ;;
      *)
        echo "未知服务: $a（可用 agent nest web）" >&2
        exit 1
        ;;
    esac
  done
  echo "${out[@]}"
}

cmd="${1:-}"
shift || true

case "$cmd" in
  start)
    targets=($(resolve_apps "$@"))
    if [[ $# -eq 0 ]]; then
      pm2 start "$ECOSYSTEM"
    else
      for name in "${targets[@]}"; do
        if pm2 describe "$name" >/dev/null 2>&1; then
          pm2 restart "$name"
        else
          pm2 start "$ECOSYSTEM" --only "$name"
        fi
      done
    fi
    pm2 save
    pm2 status
    ;;
  stop)
    targets=($(resolve_apps "$@"))
    pm2 stop "${targets[@]}"
    pm2 status
    ;;
  restart)
    targets=($(resolve_apps "$@"))
    pm2 restart "${targets[@]}"
    pm2 status
    ;;
  reload)
    if [[ $# -eq 0 ]]; then
      pm2 reload "$ECOSYSTEM" --update-env
    else
      targets=($(resolve_apps "$@"))
      for name in "${targets[@]}"; do
        pm2 reload "$ECOSYSTEM" --only "$name" --update-env
      done
    fi
    pm2 status
    ;;
  status)
    pm2 status
    echo ""
    echo "详情: pm2 describe l-resume-agent|l-resume-nest|l-resume-web"
    ;;
  logs)
    if [[ $# -eq 0 ]]; then
      pm2 logs "${APPS[@]}"
    else
      # 支持: logs nest  或  logs --lines 100
      if [[ "$1" == agent || "$1" == nest || "$1" == web || "$1" == l-resume-* ]]; then
        targets=($(resolve_apps "$1"))
        shift
        pm2 logs "${targets[@]}" "$@"
      else
        pm2 logs "${APPS[@]}" "$@"
      fi
    fi
    ;;
  monit)
    pm2 monit
    ;;
  deploy)
    bash "$ROOT/deploy/pm2-deploy.sh" "$@"
    ;;
  startup)
    pm2 startup
    pm2 save
    ;;
  ""|-h|--help)
    cat <<'EOF'
用法: bash deploy/pm2-ctl.sh <command> [服务...]

服务名可写: agent | nest | web（也可写 PM2 全名 l-resume-*）

命令:
  start [服务...]     启动（默认全部）
  stop [服务...]      停止
  restart [服务...]   硬重启（不构建）
  reload [服务...]    平滑重载
  status              查看三个服务状态
  logs [服务] [参数]  跟踪日志，例: logs nest
  monit               PM2 监控面板
  deploy [选项...]    独立构建并启动（中间失败不影响已成功服务）
  startup             配置开机自启

deploy 常用选项:
  --skip-pull  --skip-install  --migrate  --only=agent,nest,web

示例:
  bash deploy/pm2-ctl.sh deploy
  bash deploy/pm2-ctl.sh deploy --only=nest --skip-pull
  bash deploy/pm2-ctl.sh restart nest
  bash deploy/pm2-ctl.sh status
  bash deploy/pm2-ctl.sh logs agent
EOF
    ;;
  *)
    echo "未知命令: $cmd（加 --help 查看用法）" >&2
    exit 1
    ;;
esac
