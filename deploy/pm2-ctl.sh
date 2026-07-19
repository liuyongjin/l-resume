#!/usr/bin/env bash
# PM2 一键启停 / 重启 / 日志 / 部署
# 用法:
#   bash deploy/pm2-ctl.sh start|stop|restart|reload|status|logs|monit|deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOSYSTEM="$ROOT/deploy/ecosystem.config.cjs"
APPS=(l-resume-agent l-resume-nest l-resume-web)

cmd="${1:-}"
shift || true

case "$cmd" in
  start)
    pm2 start "$ECOSYSTEM"
    pm2 save
    pm2 status
    ;;
  stop)
    pm2 stop "${APPS[@]}"
    pm2 status
    ;;
  restart)
    pm2 restart "${APPS[@]}"
    pm2 status
    ;;
  reload)
    pm2 reload "$ECOSYSTEM" --update-env
    pm2 status
    ;;
  status)
    pm2 status
    ;;
  logs)
    pm2 logs "${APPS[@]}" "$@"
    ;;
  monit)
    pm2 monit
    ;;
  deploy)
    bash "$ROOT/deploy/pm2-deploy.sh" "$@"
    ;;
  startup)
    # 开机自启（首次执行，按提示再跑输出的 sudo 命令）
    pm2 startup
    pm2 save
    ;;
  ""|-h|--help)
    cat <<'EOF'
用法: bash deploy/pm2-ctl.sh <command>

  start     按 ecosystem 启动三个服务
  stop      停止三个服务
  restart   硬重启三个服务
  reload    平滑重载（读最新 ecosystem / env）
  status    查看状态
  logs      跟踪日志（可追加 pm2 logs 参数）
  monit     打开 PM2 监控面板
  deploy    一键 git pull + 构建 + reload（同 pm2-deploy.sh）
  startup   配置开机自启提示

部署示例:
  bash deploy/pm2-ctl.sh deploy
  bash deploy/pm2-ctl.sh deploy --skip-pull
  bash deploy/pm2-ctl.sh deploy --skip-install
  bash deploy/pm2-ctl.sh deploy --skip-pull --skip-install
  bash deploy/pm2-ctl.sh deploy --migrate
  bash deploy/pm2-ctl.sh deploy --only=nest,web
  bash deploy/pm2-ctl.sh deploy --help
EOF
    ;;
  *)
    echo "未知命令: $cmd（加 --help 查看用法）" >&2
    exit 1
    ;;
esac
