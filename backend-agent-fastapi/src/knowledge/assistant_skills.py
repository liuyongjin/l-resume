"""
全局助手 Skills：支持简流平台「模板创建简历」「智能执行创建简历」。

通过关键词意图检测产出可执行动作，经 SSE 下发给前端执行。
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

SKILL_CREATE_FROM_TEMPLATE = "create_resume_from_template"
SKILL_SMART_EXECUTION = "start_smart_execution"

TEMPLATE_CATALOG = [
    {
        "themeKey": "frontendEngineer",
        "name": "高级前端工程师",
        "aliases": ["前端", "高级前端", "frontend", "fe", "极简专业", "技术岗"],
    },
    {
        "themeKey": "modern",
        "name": "应届大学生",
        "aliases": ["应届", "大学生", "毕业生", "实习", "校园", "fresh"],
    },
    {
        "themeKey": "creative",
        "name": "创意设计师",
        "aliases": ["创意", "设计", "设计师", "ui", "ux", "艺术"],
    },
    {
        "themeKey": "data",
        "name": "数据分析师",
        "aliases": ["数据", "分析", "数据分析", "analyst", "量化"],
    },
    {
        "themeKey": "amber",
        "name": "产品经理",
        "aliases": ["产品", "产品经理", "pm", "产品岗"],
    },
    {
        "themeKey": "purple",
        "name": "学术研究者",
        "aliases": ["学术", "研究", "研究员", "博士", "论文"],
    },
    {
        "themeKey": "developer",
        "name": "程序开发",
        "aliases": ["开发", "程序", "全栈", "developer", "程序员", "开源"],
    },
]

SKILL_DEFINITIONS = [
    {
        "id": SKILL_CREATE_FROM_TEMPLATE,
        "name": "根据模板创建简历",
        "description": (
            "打开模板中心，或按指定模板（前端/应届/设计/数据/产品/学术/开发）直接创建简历并进入编辑器。"
            "适用于用户说「用模板创建」「新建一份前端简历」等。"
        ),
        "triggers": ["模板", "创建简历", "新建简历", "用模板", "选模板", "模板中心", "做一份简历"],
    },
    {
        "id": SKILL_SMART_EXECUTION,
        "name": "智能执行创建简历",
        "description": (
            "打开智能执行页：上传 PDF/DOC 等简历文件，经 Agent 工作流解析优化后，"
            "按所选模板与语言生成多份简历。适用于「上传简历生成」「智能执行」「一键生成」。"
        ),
        "triggers": ["智能执行", "上传简历", "工作流", "一键生成", "多模板", "解析简历", "生成版本"],
    },
]


def skill_catalog_prompt() -> str:
    lines = ["【可用 Skills（可引导用户点击按钮执行）】"]
    for skill in SKILL_DEFINITIONS:
        lines.append(f"- {skill['id']}: {skill['name']} — {skill['description']}")
    lines.append(
        "当用户明确想创建简历时，优先说明可用 Skill，并鼓励点击会话中的操作按钮；"
        "不要假装已经在后台替用户创建完成。"
    )
    lines.append("模板关键词：" + "、".join(f"{t['name']}({t['themeKey']})" for t in TEMPLATE_CATALOG))
    return "\n".join(lines)


def _match_template(query: str) -> Optional[Dict[str, str]]:
    q = (query or "").lower()
    best = None
    best_score = 0
    for item in TEMPLATE_CATALOG:
        score = 0
        if item["name"].lower() in q or item["name"] in query:
            score += 5
        if item["themeKey"].lower() in q:
            score += 4
        for alias in item["aliases"]:
            alias_l = alias.lower()
            if alias_l in q or alias in query:
                score += 2 if len(alias) > 1 else 1
        if score > best_score:
            best_score = score
            best = item
    if best_score <= 0:
        return None
    return {"themeKey": best["themeKey"], "name": best["name"]}


def _wants_create_from_template(query: str) -> bool:
    q = query or ""
    ql = q.lower()
    # 排除更偏向智能执行的说法
    if any(k in q for k in ("智能执行", "上传简历", "工作流执行", "一键生成多")):
        if "模板中心" not in q and "用模板" not in q:
            return False
    patterns = [
        r"模板",
        r"创建简历",
        r"新建简历",
        r"做一份",
        r"生成一份",
        r"用.*简历",
        r"选.*模板",
        r"template",
        r"create\s*resume",
    ]
    return any(re.search(p, q, re.I) or re.search(p, ql, re.I) for p in patterns)


def _wants_smart_execution(query: str) -> bool:
    q = query or ""
    patterns = [
        r"智能执行",
        r"上传简历",
        r"工作流",
        r"一键生成",
        r"多模板",
        r"多语言输出",
        r"解析.*简历",
        r"生成版本",
        r"smart\s*execution",
        r"upload.*resume",
    ]
    return any(re.search(p, q, re.I) for p in patterns)


def detect_skills(query: str) -> List[Dict[str, Any]]:
    """根据用户问题检测应推荐的 skills。"""
    q = (query or "").strip()
    if not q:
        return []

    skills: List[Dict[str, Any]] = []

    if _wants_smart_execution(q):
        skills.append(
            {
                "id": SKILL_SMART_EXECUTION,
                "name": "智能执行创建简历",
                "action": SKILL_SMART_EXECUTION,
                "label": "打开智能执行",
                "description": "上传简历文件，经 Agent 工作流生成多模板/多语言简历",
                "payload": {
                    "path": "/workflow/execution",
                    "query": {},
                },
            }
        )

    if _wants_create_from_template(q):
        matched = _match_template(q)
        if matched:
            label = f"用「{matched['name']}」模板创建"
            payload = {
                "path": "/templates",
                "templateHint": matched["themeKey"],
                "templateNameHint": matched["name"],
                "autoCreate": True,
            }
        else:
            label = "打开模板中心创建"
            payload = {
                "path": "/templates",
                "autoCreate": False,
            }
        skills.append(
            {
                "id": SKILL_CREATE_FROM_TEMPLATE,
                "name": "根据模板创建简历",
                "action": SKILL_CREATE_FROM_TEMPLATE,
                "label": label,
                "description": "从模板中心创建简历并进入编辑器",
                "payload": payload,
            }
        )

    return skills


def list_skills() -> List[Dict[str, Any]]:
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"],
            "triggers": s["triggers"],
        }
        for s in SKILL_DEFINITIONS
    ]
