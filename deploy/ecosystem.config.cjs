/**
 * PM2 进程配置（前端 + Nest + Agent）
 *
 * 用法（在仓库根目录）:
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 reload deploy/ecosystem.config.cjs --update-env
 *   pm2 stop all / pm2 restart all / pm2 status / pm2 logs
 */
const path = require('path')

const root = path.join(__dirname, '..')
const agentDir = path.join(root, 'backend-agent-python')
const nestDir = path.join(root, 'backend-nest')
const webDir = path.join(root, 'frontend-web')

/** Linux venv 优先，其次 Windows，再退回系统 python3 */
function resolveAgentPython() {
  const candidates = [
    path.join(agentDir, '.venv', 'bin', 'python'),
    path.join(agentDir, '.venv', 'Scripts', 'python.exe'),
    'python3',
  ]
  const fs = require('fs')
  for (const p of candidates) {
    if (p === 'python3') return p
    try {
      if (fs.existsSync(p)) return p
    } catch {
      // ignore
    }
  }
  return 'python3'
}

module.exports = {
  apps: [
    {
      name: 'l-resume-agent',
      cwd: agentDir,
      script: 'src/main.py',
      interpreter: resolveAgentPython(),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
      kill_timeout: 10000,
      // Agent 读自己的 .env；勿把密钥写进本文件
      env: {
        NODE_ENV: 'production',
        API_DEBUG: 'false',
      },
    },
    {
      name: 'l-resume-nest',
      cwd: nestDir,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'l-resume-web',
      cwd: webDir,
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
        NITRO_HOST: '0.0.0.0',
        NITRO_PORT: 3000,
      },
    },
  ],
}
