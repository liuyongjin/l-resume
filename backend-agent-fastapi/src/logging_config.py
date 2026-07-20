"""
多智能体服务统一日志配置。
必须在其他业务模块 import 之前加载，确保控制台与 logs/ 目录双写。
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from pathlib import Path

_CONFIGURED = False

# backend-agent-fastapi/ 目录（与 src/ 同级）
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOG_DIR = PROJECT_ROOT / "logs"

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DETAILED_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(filename)s:%(lineno)d | %(message)s"


def _log_paths() -> tuple[Path, Path, Path]:
    date = datetime.now().strftime("%Y%m%d")
    return (
        LOG_DIR / f"multiagent_{date}.log",
        LOG_DIR / f"multiagent_error_{date}.log",
        LOG_DIR / f"multiagent_api_{date}.log",
    )


def setup_logging(force: bool = False) -> None:
    global _CONFIGURED
    if _CONFIGURED and not force:
        return

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file, error_file, api_file = _log_paths()

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    if force:
        root.handlers.clear()

    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter(LOG_FORMAT))

    root_file = logging.FileHandler(log_file, encoding="utf-8")
    root_file.setLevel(logging.INFO)
    root_file.setFormatter(logging.Formatter(LOG_FORMAT))

    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        root.addHandler(console)
    if not any(isinstance(h, logging.FileHandler) and h.baseFilename == str(log_file) for h in root.handlers):
        root.addHandler(root_file)

    def attach_named(name: str, file_path: Path, level: int, fmt: str) -> logging.Logger:
        named = logging.getLogger(name)
        named.setLevel(level)
        named.propagate = True
        handler = logging.FileHandler(file_path, encoding="utf-8")
        handler.setLevel(level)
        handler.setFormatter(logging.Formatter(fmt))
        if not any(
            isinstance(h, logging.FileHandler) and h.baseFilename == str(file_path)
            for h in named.handlers
        ):
            named.addHandler(handler)
        return named

    attach_named("multiagent.business", log_file, logging.INFO, LOG_FORMAT)
    attach_named("multiagent.api", api_file, logging.INFO, DETAILED_FORMAT)
    attach_named("multiagent.error", error_file, logging.ERROR, DETAILED_FORMAT)

    _CONFIGURED = True


def get_log_dir() -> Path:
    return LOG_DIR
