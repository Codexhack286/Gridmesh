"""Simulated clock: 15-min OPSD steps replayed as ticks."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SimClock:
    tick: int = 0
    step_seconds: int = 900

    def advance(self) -> int:
        self.tick += 1
        return self.tick

    def reset(self) -> None:
        self.tick = 0
