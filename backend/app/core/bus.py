"""Minimal in-process pub/sub bus (LangGraph runs on top of this event log)."""
from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable


class AgentBus:
    def __init__(self) -> None:
        self._subs: dict[str, list[Callable]] = defaultdict(list)
        self.events: list[tuple[str, dict]] = []

    def subscribe(self, topic: str, fn: Callable) -> None:
        self._subs[topic].append(fn)

    def publish(self, topic: str, payload: dict) -> None:
        self.events.append((topic, payload))
        for fn in self._subs[topic]:
            fn(payload)
