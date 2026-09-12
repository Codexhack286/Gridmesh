"""Ledger interface. Phase 1-3: plain table. Phase 4: hash-chained swap-in."""
from __future__ import annotations

from abc import ABC, abstractmethod


class TradeLedger(ABC):
    @abstractmethod
    def append(self, trade: dict) -> dict:
        """Persist a cleared trade, return stored record."""

    @abstractmethod
    def list(self) -> list[dict]:
        """Return all stored trades in order."""
