"""
Agent FastAPI 冒烟测试（不依赖 Nest）。
用法（在 backend-agent-fastapi 目录）:
  pip install -r requirements.txt
  python scripts/smoke_test.py
  # 或先启动服务再测: python src/main.py --dev
"""
from __future__ import annotations

import json
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))


def _get(url: str, timeout: float = 5.0) -> tuple[int, dict | str]:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "ignore")
            try:
                return resp.status, json.loads(body)
            except json.JSONDecodeError:
                return resp.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body


def main() -> int:
    import uvicorn
    import main as agent_main

    host = "127.0.0.1"
    port = 5011  # 避免与运行中的 5001 冲突
    base = f"http://{host}:{port}"

    config = uvicorn.Config(
        agent_main.app,
        host=host,
        port=port,
        log_level="warning",
    )
    server = uvicorn.Server(config)

    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    for _ in range(50):
        try:
            status, data = _get(f"{base}/health")
            if status == 200:
                break
        except Exception:
            time.sleep(0.1)
    else:
        print("FAIL: server did not start")
        return 1

    print("health:", json.dumps(data, ensure_ascii=False)[:300])
    assert isinstance(data, dict)
    assert data.get("status") == "ok"
    assert data.get("service") == "backend-agent-fastapi"
    assert data.get("framework") == "fastapi"

    status, caps = _get(f"{base}/api/agents/capabilities")
    assert status == 200 and isinstance(caps, dict) and caps.get("success") is True
    assert "workflows" in (caps.get("data") or {})
    print("capabilities: ok, workflows=", len(caps["data"]["workflows"]))

    status, skills = _get(f"{base}/api/agents/assistant-skills")
    assert status == 200 and isinstance(skills, dict) and skills.get("success") is True
    print("assistant-skills: ok, count=", len((skills.get("data") or {}).get("skills") or []))

    # 触发关闭
    server.should_exit = True
    thread.join(timeout=5)
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
