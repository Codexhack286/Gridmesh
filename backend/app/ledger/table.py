"""Plain in-memory trade-log table (Phase 4 replaces with hash-chained rows)."""
from __future__ import annotations

from app.ledger.interface import TradeLedger


class TableLedger(TradeLedger):
    def __init__(self) -> None:
        self._rows: list[dict] = []

    def append(self, trade: dict) -> dict:
        record = {"index": len(self._rows), **trade}
        self._rows.append(record)
        return record

    def list(self) -> list[dict]:
        return list(self._rows)


LEDGER = TableLedger()
