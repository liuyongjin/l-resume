/**
 * 释放指定端口上占用的进程（开发环境用）
 * 用法: node scripts/free-port.cjs [port]
 * 默认端口与 Nest 一致：3001（也可读 .env 的 PORT）
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function readPortFromEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env')
    const text = fs.readFileSync(envPath, 'utf8')
    const match = text.match(/^\s*PORT\s*=\s*["']?(\d+)["']?\s*$/m)
    if (match) return Number(match[1])
  } catch {
    // ignore missing .env
  }
  return null
}

const port = Number(
  process.argv[2] || process.env.PORT || readPortFromEnvFile() || 3001,
)

function freePortWin32() {
  let output = ''
  try {
    output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
  } catch {
    return
  }

  const pids = new Set()
  for (const line of output.split('\n')) {
    if (!line.includes('LISTENING')) continue
    const parts = line.trim().split(/\s+/)
    const pid = parts[parts.length - 1]
    if (pid && /^\d+$/.test(pid) && pid !== '0') {
      pids.add(pid)
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      console.log(`[free-port] 已结束占用端口 ${port} 的进程 PID=${pid}`)
    } catch {
      // ignore
    }
  }
}

function freePortUnix() {
  // Ubuntu 最小安装常无 lsof；优先 fuser，再回退 lsof
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' })
    console.log(`[free-port] 已释放端口 ${port}`)
    return
  } catch {
    // try lsof fallback
  }

  try {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' })
    console.log(`[free-port] 已释放端口 ${port}`)
  } catch {
    // port already free
  }
}

if (process.platform === 'win32') {
  freePortWin32()
} else {
  freePortUnix()
}
