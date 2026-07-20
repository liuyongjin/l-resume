"""
全局助手 RAG：基于关键词匹配检索产品功能与简历知识。
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

from knowledge.product_docs import PRODUCT_DOCS


def _tokenize(query: str) -> List[str]:
    q = (query or "").strip().lower()
    if not q:
        return []
    tokens = re.findall(r"[a-z0-9_./:+-]{2,}", q)
    for block in re.findall(r"[\u4e00-\u9fff]+", q):
        if len(block) <= 2:
            tokens.append(block)
        else:
            tokens.append(block)
            tokens.extend(block[i : i + 2] for i in range(len(block) - 1))
    seen = set()
    out: List[str] = []
    for t in tokens:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def _build_chunks(kb: Any) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []

    for doc in PRODUCT_DOCS:
        tags = [str(t).lower() for t in (doc.get("tags") or [])]
        title = str(doc.get("title") or "")
        content = str(doc.get("content") or "")
        chunks.append(
            {
                "id": str(doc.get("id") or title),
                "title": title,
                "tags": tags,
                "text": f"{title}\n{content}",
                "search_blob": " ".join([title.lower(), content.lower(), *tags]),
            }
        )

    for tid in ("classic", "modern", "creative", "data", "amber", "purple", "developer"):
        tpl = kb.get_template_definition(tid)
        name = tpl.get("name", tid)
        role = tpl.get("target_role", "")
        emphasis = tpl.get("emphasis", "")
        labels = ", ".join((tpl.get("section_labels") or {}).values())
        text = f"模板「{name}」适合：{role}。写作重点：{emphasis}。主要板块：{labels}。"
        chunks.append(
            {
                "id": f"template-{tid}",
                "title": f"简历模板-{name}",
                "tags": [tid, str(name).lower(), "模板", "template", str(role).lower()],
                "text": text,
                "search_blob": text.lower(),
            }
        )

    kb.load()
    for industry, words in getattr(kb, "_industry_keywords", {}).items():
        joined = ", ".join(words)
        text = f"{industry}行业常见简历关键词：{joined}。写简历时可自然融入 JD 中的同类词。"
        chunks.append(
            {
                "id": f"keywords-{industry}",
                "title": f"{industry}行业关键词",
                "tags": [str(industry).lower(), "关键词", "keyword", "行业"],
                "text": text,
                "search_blob": text.lower(),
            }
        )

    practices = getattr(kb, "_best_practices", {}) or {}
    practice_text = "简历写作最佳实践：\n" + "\n".join(f"- {v}" for v in practices.values())
    chunks.append(
        {
            "id": "best-practices",
            "title": "简历写作最佳实践",
            "tags": ["最佳实践", "怎么写", "量化", "star", "ats"],
            "text": practice_text,
            "search_blob": practice_text.lower(),
        }
    )

    action_verbs = getattr(kb, "_action_verbs", {}) or {}
    verbs_zh = ", ".join(action_verbs.get("chinese", [])[:16])
    verbs_en = ", ".join(action_verbs.get("english", [])[:16])
    verbs_text = f"中文推荐行为动词：{verbs_zh}。English action verbs: {verbs_en}。"
    chunks.append(
        {
            "id": "action-verbs",
            "title": "简历行为动词",
            "tags": ["动词", "action", "动词开头", "led", "主导"],
            "text": verbs_text,
            "search_blob": verbs_text.lower(),
        }
    )

    return chunks


def retrieve_for_assistant(kb: Any, query: str, top_k: int = 5) -> Tuple[str, List[str]]:
    """检索产品功能 + 简历知识，返回 (context_text, hit_titles)。"""
    kb.load()
    chunks = _build_chunks(kb)
    tokens = _tokenize(query)

    if not tokens:
        fallback_ids = {"product-overview", "resume-writing-basics", "nav-routes"}
        picked = [c for c in chunks if c["id"] in fallback_ids]
    else:
        scored: List[Tuple[float, Dict[str, Any]]] = []
        for chunk in chunks:
            blob = chunk["search_blob"]
            score = 0.0
            for tok in tokens:
                if tok in blob:
                    if tok in chunk["tags"]:
                        score += 3.0
                    elif tok in chunk["title"].lower():
                        score += 2.0
                    else:
                        score += 1.0
            if score > 0:
                scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        picked = [c for _, c in scored[:top_k]]
        if not picked:
            picked = [c for c in chunks if c["id"] in {"product-overview", "troubleshooting"}]

    titles = [c["title"] for c in picked]
    parts = ["【检索到的简流知识（请优先依据以下内容回答，不要编造未提及的功能）】"]
    for i, chunk in enumerate(picked, 1):
        parts.append(f"\n### {i}. {chunk['title']}\n{chunk['text']}")
    return "\n".join(parts), titles
