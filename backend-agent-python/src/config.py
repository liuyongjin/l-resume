"""
AI 服务配置文件
模型、API 地址、QPS、超时等统一读取 backend-nest/config/llm-models.json；
.env 仅保留 API Key 与本地服务端口等部署项。
"""

import json
import os
from dotenv import load_dotenv
from pathlib import Path
from typing import Dict, List, Optional

CONFIG_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(CONFIG_PATH)

_env_catalog = os.getenv("LLM_MODELS_CATALOG_PATH", "").strip()
if _env_catalog:
    CATALOG_PATH = Path(_env_catalog)
else:
    CATALOG_PATH = Path(__file__).parent.parent.parent / "backend-nest" / "config" / "llm-models.json"
# Docker 镜像内 catalog 位于 /app/config/llm-models.json
if not CATALOG_PATH.exists():
    docker_catalog = Path(__file__).parent.parent / "config" / "llm-models.json"
    if docker_catalog.exists():
        CATALOG_PATH = docker_catalog


def _load_llm_catalog() -> dict:
    if CATALOG_PATH.exists():
        with CATALOG_PATH.open("r", encoding="utf-8") as fp:
            return json.load(fp)
    return {
        "defaultModelId": "glm-4.7-flash",
        "legacyAliases": {
            "glm-4-flash": "glm-4.7-flash",
            "glm-4-plus": "glm-4.7-flash",
            "glm-4-air": "glm-4-flash-250414",
        },
        "provider": {
            "id": "zhipu",
            "name": "智谱清言",
            "apiUrl": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            "apiKeyEnv": "ZHIPU_API_KEY",
        },
        "agentRuntime": {
            "qpsLimit": 1,
            "temperature": 0.7,
            "maxTokens": 2048,
            "timeoutSeconds": 60,
            "logApiCalls": True,
        },
        "nestRuntime": {
            "multiagentHealthTimeoutMs": 5000,
            "multiagentCallTimeoutMs": 120000,
            "httpToolTimeoutMs": 30000,
        },
        "models": [
            {"id": "glm-4.7-flash", "resumeText": True, "isActive": True, "isDefault": True},
            {"id": "glm-4-flash-250414", "resumeText": True, "isActive": True, "isDefault": False},
        ],
    }


_LLM_CATALOG = _load_llm_catalog()
_LLM_PROVIDER: Dict[str, str] = _LLM_CATALOG.get("provider") or {}
_LLM_RUNTIME: Dict[str, object] = _LLM_CATALOG.get("agentRuntime") or {}
DEFAULT_ZHIPU_MODEL: str = _LLM_CATALOG.get("defaultModelId", "glm-4.7-flash")
LEGACY_ZHIPU_MODEL_ALIASES: Dict[str, str] = _LLM_CATALOG.get("legacyAliases", {})
_CATALOG_MODELS: List[dict] = _LLM_CATALOG.get("models", [])
SUPPORTED_ZHIPU_MODELS: List[str] = [
    m["id"] for m in _CATALOG_MODELS if m.get("isActive", True)
]
RESUME_TEXT_ZHIPU_MODELS: List[str] = [
    m["id"] for m in _CATALOG_MODELS if m.get("resumeText") is True and m.get("isActive", True)
]
DEFAULT_LLM_API_URL: str = (
    _LLM_PROVIDER.get("apiUrl") or "https://open.bigmodel.cn/api/paas/v4/chat/completions"
).strip()
LLM_API_KEY_ENV: str = (_LLM_PROVIDER.get("apiKeyEnv") or "ZHIPU_API_KEY").strip()


class AIConfig:
    """AI 服务配置类（以 llm-models.json 为唯一配置源）"""

    @property
    def ZHIPU_API_KEY(self) -> str:
        return os.getenv(LLM_API_KEY_ENV, os.getenv("ZHIPU_API_KEY", "")).strip()

    @property
    def ZHIPU_MODEL(self) -> str:
        return DEFAULT_ZHIPU_MODEL

    @property
    def ZHIPU_API_URL(self) -> str:
        return DEFAULT_LLM_API_URL

    @property
    def ZHIPU_SUPPORTED_MODELS(self) -> List[str]:
        return list(SUPPORTED_ZHIPU_MODELS)

    @property
    def AI_QPS_LIMIT(self) -> int:
        return int(_LLM_RUNTIME.get("qpsLimit", 1))

    @property
    def API_TEMPERATURE(self) -> float:
        return float(_LLM_RUNTIME.get("temperature", 0.7))

    @property
    def API_MAX_TOKENS(self) -> int:
        return int(_LLM_RUNTIME.get("maxTokens", 2048))

    @property
    def API_TIMEOUT(self) -> int:
        return int(_LLM_RUNTIME.get("timeoutSeconds", 60))

    @property
    def LOG_API_CALLS(self) -> bool:
        return bool(_LLM_RUNTIME.get("logApiCalls", True))

    @property
    def catalog_path(self) -> str:
        return str(CATALOG_PATH)

    def normalize_model(self, model: Optional[str] = None) -> str:
        raw = (model or self.ZHIPU_MODEL or DEFAULT_ZHIPU_MODEL).strip()
        if not raw:
            return DEFAULT_ZHIPU_MODEL
        key = raw.lower()
        key = LEGACY_ZHIPU_MODEL_ALIASES.get(key, key)
        supported = {item.lower(): item for item in self.ZHIPU_SUPPORTED_MODELS}
        if key in supported:
            return supported[key]
        for item in SUPPORTED_ZHIPU_MODELS:
            if item.lower() == key:
                return item
        return key

    def normalize_resume_model(self, model: Optional[str] = None) -> str:
        normalized = self.normalize_model(model)
        resume_set = {item.lower(): item for item in RESUME_TEXT_ZHIPU_MODELS}
        if normalized.lower() in resume_set:
            return resume_set[normalized.lower()]
        if RESUME_TEXT_ZHIPU_MODELS:
            return RESUME_TEXT_ZHIPU_MODELS[0]
        return DEFAULT_ZHIPU_MODEL

    def get_config_dict(self) -> dict:
        return {
            "catalog_path": self.catalog_path,
            "provider": _LLM_PROVIDER.get("id", "zhipu"),
            "model": self.normalize_resume_model(self.ZHIPU_MODEL),
            "supported_models": self.ZHIPU_SUPPORTED_MODELS,
            "resume_text_models": RESUME_TEXT_ZHIPU_MODELS,
            "api_url": self.ZHIPU_API_URL,
            "qps_limit": self.AI_QPS_LIMIT,
            "temperature": self.API_TEMPERATURE,
            "max_tokens": self.API_MAX_TOKENS,
            "timeout": self.API_TIMEOUT,
            "log_api_calls": self.LOG_API_CALLS,
        }

    def validate_config(self) -> tuple:
        if not self.ZHIPU_API_KEY:
            return False, f"大模型 API Key 未配置，请在 backend-agent-python/.env 中设置 {LLM_API_KEY_ENV}"
        if self.AI_QPS_LIMIT < 1:
            return False, "QPS 限制必须 >= 1"
        if not CATALOG_PATH.exists():
            return False, f"模型配置不存在: {CATALOG_PATH}"
        return True, ""

    def print_config(self) -> None:
        print("=" * 60)
        print("AI 服务配置")
        print("=" * 60)
        print(f"Catalog: {CATALOG_PATH}")
        print(f"Provider: {_LLM_PROVIDER.get('name', 'zhipu')}")
        print(f"Default Model: {self.normalize_resume_model(self.ZHIPU_MODEL)}")
        print(f"Resume Text Models: {', '.join(RESUME_TEXT_ZHIPU_MODELS)}")
        print(f"Supported Models: {', '.join(self.ZHIPU_SUPPORTED_MODELS)}")
        print(f"API URL: {self.ZHIPU_API_URL}")
        print(f"QPS Limit: {self.AI_QPS_LIMIT}")
        print(f"Temperature: {self.API_TEMPERATURE}")
        print(f"Max Tokens: {self.API_MAX_TOKENS}")
        print(f"Timeout: {self.API_TIMEOUT}s")
        print(f"Log API Calls: {self.LOG_API_CALLS}")
        print(f"API Key Configured: {'Yes' if self.ZHIPU_API_KEY else 'No'}")
        print("=" * 60)


ai_config = AIConfig()

__all__ = ["AIConfig", "ai_config", "CATALOG_PATH"]
