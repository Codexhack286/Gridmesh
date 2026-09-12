"""Plain in-memory trade-log table (Phase 4 replaces with hash-chained rows)."""
from __future__ import annotations

from app.ledger.interface import TradeLedger
from app.ledger.sqlite_ledger import SQLiteLedger


class TableLedger(TradeLedger):
    def __init__(self) -> None:
        self._rows: list[dict] = []

    def append(self, trade: dict) -> dict:
        record = {"index": len(self._rows), **trade}
        self._rows.append(record)
        return record

    def list(self) -> list[dict]:
        return list(self._rows)
    def stats(self) -> dict:
        total_kwh = sum(t.get("qty_kwh", 0) for t in self._rows)
        total_value = sum(t.get("qty_kwh", 0) * t.get("clearing_price", 0) for t in self._rows)
        return {
            "total_trades": len(self._rows),
            "total_kwh": total_kwh,
            "total_value_usd": total_value,
            "first_tick": self._rows[0]["tick"] if self._rows else 0,
            "last_tick": self._rows[-1]["tick"] if self._rows else 0,
        }


LEDGER = SQLiteLedger()
