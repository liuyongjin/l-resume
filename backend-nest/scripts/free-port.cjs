/**
 * 释放指定端口上占用的进程（开发环境用）
 * 用法: node scripts/free-port.cjs [port]
 */
const { execSync } = require('child_process')

const port = Number(process.argv[2] || process.env.PORT || 3002)

function freePortWin32() {
  let output = ''
  try {
    output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
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
