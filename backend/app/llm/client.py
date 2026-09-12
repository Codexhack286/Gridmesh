"""Free-tier LLM client: Groq Cloud / NVIDIA NIM (both OpenAI-compatible).

Falls back to cached JSON in data/fallbacks/ when no key is set or a call fails,
so the demo runs fully offline per the PRD resilience NFR.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.core import config

FALLBACK_DIR = Path(__file__).resolve().parents[3] / "data" / "fallbacks"


def _fallback(name: str) -> dict:
    return json.loads((FALLBACK_DIR / f"{name}.json").read_text())


def _provider() -> tuple[str, str, str]:
    if config.LLM_PROVIDER.lower() == "nim" and config.NIM_API_KEY:
        return ("https://integrate.api.nvidia.com/v1", config.NIM_API_KEY, config.NIM_MODEL)
    return ("https://api.groq.com/openai/v1", config.GROQ_API_KEY, config.GROQ_MODEL)


def complete_json(prompt: str, fallback_name: str) -> dict:
    base_url, api_key, model = _provider()
    if not api_key:
        return _fallback(fallback_name)
    try:
        import httpx

        resp = httpx.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "Respond with a single JSON object only."},
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        return json.loads(resp.json()["choices"][0]["message"]["content"])
    except Exception:
        return _fallback(fallback_name)
