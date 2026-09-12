"""In-memory violation log: all flagged audit results across all ticks.

Same pattern as TableLedger — Phase 4 will persist this to SQLite alongside trades.
Can be queried via GET /api/scenario/violations.
"""
from __future__ import annotations

from app.core.schemas import ViolationEvent


class ViolationLog:
    def __init__(self) -> None:
        self._events: list[dict] = []

    def append(self, event: ViolationEvent) -> dict:
        record = {"index": len(self._events), **event.model_dump()}
        self._events.append(record)
        return record

    def list(self, injected_only: bool = False) -> list[dict]:
        if injected_only:
            return [e for e in self._events if e.get("injected")]
        return list(self._events)

    def count(self) -> int:
        return len(self._events)

    def clear(self) -> int:
        """Wipe all events (useful for test teardown). Returns number cleared."""
        n = len(self._events)
        self._events.clear()
        return n


# Module-level singleton — imported by RegulationAgent, scenarios router, and ticks route
VIOLATION_LOG = ViolationLog()
