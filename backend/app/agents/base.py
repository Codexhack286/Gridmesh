"""Thin agent base: every agent returns dicts with a rationale string."""
from __future__ import annotations

from typing import Any


class BaseAgent:
    name = "base"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError
