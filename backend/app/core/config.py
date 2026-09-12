"""Runtime config from environment."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _get(key: str, default: str) -> str:
    return os.getenv(key, default)


LLM_PROVIDER = _get("LLM_PROVIDER", "groq")
GROQ_API_KEY = _get("GROQ_API_KEY", "")
GROQ_MODEL = _get("GROQ_MODEL", "llama-3.3-70b-versatile")
NIM_API_KEY = _get("NIM_API_KEY", "")
NIM_MODEL = _get("NIM_MODEL", "meta/llama-3.1-70b-instruct")
TICK_SECONDS = int(_get("GRIDMESH_TICK_SECONDS", "900"))
PARTICIPANTS = int(_get("GRIDMESH_PARTICIPANTS", "5"))
DATABASE_URL = _get("DATABASE_URL", "sqlite:///./gridmesh.db")
# Calibrated so the 2016-06-10 demo slice trips stress on its evening peak
# (17/96 ticks) while midday surplus stays a trading window.
STRESS_THRESHOLD_KW = float(_get("GRIDMESH_STRESS_KW", "6.0"))
