"""SQLite implementation of the TradeLedger interface.

Provides persistent storage for trades, audits, and violations using Python stdlib sqlite3.
Implements WAL mode for concurrent readers and uses a tamper-evident SHA-256 hash
for audit records.
"""
from __future__ import annotations

import hashlib
import sqlite3
from typing import Any

from app.core import config
from app.ledger.interface import TradeLedger


def _audit_hash(tick: int, trade_index: int, flag: str, rationale: str) -> str:
    """Tamper-evident hash for audit records."""
    payload = f"{tick}|{trade_index}|{flag}|{rationale}"
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


class SQLiteLedger(TradeLedger):
    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or str(config.DB_PATH)
        # isolation_level=None enables autocommit mode, check_same_thread=False for FastAPI pool
        self.conn = sqlite3.connect(
            self.db_path, check_same_thread=False, isolation_level=None
        )
        self.conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self) -> None:
        # WAL mode is critical for concurrent FastAPI readers
        self.conn.execute("PRAGMA journal_mode=WAL")
        
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS trades (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                tick            INTEGER NOT NULL,
                buyer_id        TEXT    NOT NULL,
                seller_id       TEXT    NOT NULL,
                qty_kwh         REAL    NOT NULL,
                clearing_price  REAL    NOT NULL,
                rationale       TEXT    DEFAULT '',
                created_at      TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS audits (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                tick            INTEGER NOT NULL,
                trade_index     INTEGER NOT NULL,
                passed          INTEGER NOT NULL,
                flag            TEXT    DEFAULT '',
                rationale       TEXT    DEFAULT '',
                severity        TEXT    DEFAULT 'info',
                enforcement     TEXT    DEFAULT 'none',
                rule_id         TEXT    DEFAULT '',
                audit_hash      TEXT    NOT NULL,
                created_at      TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS violations (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                tick            INTEGER NOT NULL,
                rule_id         TEXT    NOT NULL,
                flag            TEXT    NOT NULL,
                severity        TEXT    NOT NULL,
                enforcement     TEXT    NOT NULL,
                buyer_id        TEXT    NOT NULL,
                seller_id       TEXT    NOT NULL,
                qty_kwh         REAL    NOT NULL,
                clearing_price  REAL    NOT NULL,
                rationale       TEXT    DEFAULT '',
                injected        INTEGER DEFAULT 0,
                created_at      TEXT    DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_trades_tick      ON trades(tick);
            CREATE INDEX IF NOT EXISTS idx_trades_buyer     ON trades(buyer_id);
            CREATE INDEX IF NOT EXISTS idx_audits_tick      ON audits(tick);
            CREATE INDEX IF NOT EXISTS idx_violations_flag  ON violations(flag);
            """
        )

    def append(self, trade: dict) -> dict:
        """Insert a trade into the SQLite DB. Returns the trade with its new ID."""
        cursor = self.conn.execute(
            """
            INSERT INTO trades (tick, buyer_id, seller_id, qty_kwh, clearing_price, rationale)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                trade["tick"],
                trade["buyer_id"],
                trade["seller_id"],
                float(trade["qty_kwh"]),
                float(trade["clearing_price"]),
                trade.get("rationale", ""),
            ),
        )
        trade_id = cursor.lastrowid
        return {"index": trade_id, **trade}

    def list(self) -> list[dict]:
        """Return all trades ordered by ID."""
        cursor = self.conn.execute(
            "SELECT * FROM trades ORDER BY id ASC"
        )
        return [dict(row) for row in cursor.fetchall()]

    def stats(self) -> dict:
        """Aggregate stats computed in SQL for O(1) performance."""
        cursor = self.conn.execute(
            """
            SELECT
                COUNT(*)              AS total_trades,
                COALESCE(SUM(qty_kwh), 0)                    AS total_kwh,
                COALESCE(SUM(qty_kwh * clearing_price), 0)   AS total_value_usd,
                COALESCE(MIN(tick), 0)                        AS first_tick,
                COALESCE(MAX(tick), 0)                        AS last_tick
            FROM trades;
            """
        )
        return dict(cursor.fetchone() or {})
    
    # ── Extra persistence helpers (audits & violations) ────────────────────────
    
    def append_audit(self, audit: dict) -> dict:
        h = _audit_hash(audit["tick"], audit["trade_index"], audit.get("flag", ""), audit.get("rationale", ""))
        self.conn.execute(
            """
            INSERT INTO audits (tick, trade_index, passed, flag, rationale, severity, enforcement, rule_id, audit_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                audit["tick"],
                audit["trade_index"],
                1 if audit.get("passed") else 0,
                audit.get("flag", ""),
                audit.get("rationale", ""),
                audit.get("severity", "info"),
                audit.get("enforcement", "none"),
                audit.get("rule_id", ""),
                h,
            ),
        )
        return {**audit, "audit_hash": h}
        
    def get_audit_hashes(self) -> list[str]:
        cursor = self.conn.execute("SELECT audit_hash FROM audits")
        return [row[0] for row in cursor.fetchall()]

    def close(self) -> None:
        self.conn.close()
