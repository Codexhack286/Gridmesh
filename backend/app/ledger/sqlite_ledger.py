"""SQLite implementation of the TradeLedger interface.

Provides persistent storage for trades, audits, and violations using Python stdlib sqlite3.
Implements WAL mode for concurrent readers and uses a tamper-evident SHA-256 hash
for audit records.

Phase 4 adds a tick-level hash chain (blocks table, one block per tick) OVER the
row-level hashes: block_hash = SHA256(prev_hash + serialized_trades +
serialized_audits + str(tick)). Editing any historical trade/audit row breaks
verification because close_block() re-reads rows from the DB when hashing.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
from typing import Any

from app.core import config
from app.ledger.interface import TradeLedger


GENESIS_PREV_HASH = "0" * 64


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

            CREATE TABLE IF NOT EXISTS blocks (
                block_index       INTEGER PRIMARY KEY,
                prev_hash         TEXT    NOT NULL,
                block_hash        TEXT    NOT NULL,
                trade_count       INTEGER NOT NULL,
                audit_count       INTEGER NOT NULL,
                created_at        TEXT    DEFAULT (datetime('now'))
            );
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

    # ── Phase 4: tick-level hash chain ─────────────────────────────────────

    def _block_prev_hash(self, tick: int) -> str:
        """prev_hash = block_hash of the highest block_index below tick, else genesis."""
        row = self.conn.execute(
            "SELECT block_hash FROM blocks WHERE block_index < ? ORDER BY block_index DESC LIMIT 1",
            (tick,),
        ).fetchone()
        return str(row[0]) if row else GENESIS_PREV_HASH

    def _expected_block_hash(self, tick: int, prev_hash: str) -> tuple[str, list[dict], list[dict]]:
        """Recompute a tick's block hash from DB rows (shared by close/verify)."""
        trade_rows = [
            dict(r)
            for r in self.conn.execute(
                "SELECT tick, buyer_id, seller_id, qty_kwh, clearing_price, rationale "
                "FROM trades WHERE tick = ? ORDER BY id ASC",
                (tick,),
            ).fetchall()
        ]
        audit_rows = [
            dict(r)
            for r in self.conn.execute(
                "SELECT tick, trade_index, passed, flag, rationale, severity, "
                "enforcement, rule_id, audit_hash FROM audits "
                "WHERE tick = ? ORDER BY trade_index ASC, id ASC",
                (tick,),
            ).fetchall()
        ]
        serialized_trades = json.dumps(trade_rows, sort_keys=True, separators=(",", ":"))
        serialized_audits = json.dumps(audit_rows, sort_keys=True, separators=(",", ":"))
        block_hash = hashlib.sha256(
            (prev_hash + serialized_trades + serialized_audits + str(tick)).encode()
        ).hexdigest()
        return block_hash, trade_rows, audit_rows

    def close_block(self, tick: int) -> dict:
        """Mint (or return existing) block for tick over DB-persisted rows.

        Reads trades/audits for tick back from their tables (never from
        in-memory state), serializes deterministically (row-id order, sorted
        JSON keys), hashes SHA256(prev_hash + trades + audits + str(tick)),
        inserts the block row and returns it. Idempotent: re-closing an
        existing tick returns the stored row.
        """
        existing = self.conn.execute(
            "SELECT block_index, prev_hash, block_hash, trade_count, audit_count "
            "FROM blocks WHERE block_index = ?",
            (tick,),
        ).fetchone()
        if existing:
            return dict(existing)

        prev_hash = self._block_prev_hash(tick)
        block_hash, trade_rows, audit_rows = self._expected_block_hash(tick, prev_hash)
        self.conn.execute(
            "INSERT INTO blocks (block_index, prev_hash, block_hash, trade_count, audit_count) "
            "VALUES (?, ?, ?, ?, ?)",
            (tick, prev_hash, block_hash, len(trade_rows), len(audit_rows)),
        )
        row = self.conn.execute(
            "SELECT block_index, prev_hash, block_hash, trade_count, audit_count "
            "FROM blocks WHERE block_index = ?",
            (tick,),
        ).fetchone()
        return dict(row)

    def list_blocks(self) -> list[dict]:
        """Return all blocks ordered by index (chain order)."""
        cursor = self.conn.execute(
            "SELECT block_index, prev_hash, block_hash, trade_count, audit_count "
            "FROM blocks ORDER BY block_index ASC"
        )
        return [dict(row) for row in cursor.fetchall()]

    # ── Tick replay guard: read-back helpers (no side effects) ─────────────

    def has_block(self, tick: int) -> bool:
        """Cheap existence check: has this tick already been closed? No writes."""
        row = self.conn.execute(
            "SELECT 1 FROM blocks WHERE block_index = ?", (tick,)
        ).fetchone()
        return row is not None

    def get_trades_for_tick(self, tick: int) -> list[dict]:
        """Already-persisted trades for tick, in tick-response shape."""
        return [
            {
                "index": int(r["id"]),
                "tick": int(r["tick"]),
                "buyer_id": str(r["buyer_id"]),
                "seller_id": str(r["seller_id"]),
                "qty_kwh": float(r["qty_kwh"]),
                "clearing_price": float(r["clearing_price"]),
                "rationale": str(r["rationale"] or ""),
            }
            for r in self.conn.execute(
                "SELECT id, tick, buyer_id, seller_id, qty_kwh, clearing_price, rationale "
                "FROM trades WHERE tick = ? ORDER BY id ASC",
                (tick,),
            ).fetchall()
        ]

    def get_audits_for_tick(self, tick: int) -> list[dict]:
        """Already-persisted audits for tick, in tick-response shape (with hash)."""
        return [
            {
                "tick": int(r["tick"]),
                "trade_index": int(r["trade_index"]),
                "passed": bool(r["passed"]),
                "flag": str(r["flag"] or ""),
                "rationale": str(r["rationale"] or ""),
                "severity": str(r["severity"] or "info"),
                "enforcement": str(r["enforcement"] or "none"),
                "rule_id": str(r["rule_id"] or ""),
                "audit_hash": str(r["audit_hash"]),
            }
            for r in self.conn.execute(
                "SELECT tick, trade_index, passed, flag, rationale, severity, "
                "enforcement, rule_id, audit_hash FROM audits "
                "WHERE tick = ? ORDER BY trade_index ASC, id ASC",
                (tick,),
            ).fetchall()
        ]

    def verify_chain(self) -> dict:
        """Walk every block in index order, recompute hashes, check linkage.

        For each block: (a) recompute expected block_hash from the tick's
        CURRENT trades/audits rows via _expected_block_hash using the STORED
        prev_hash (so row tampering breaks hash_match); (b) check stored
        prev_hash equals the previous block's stored block_hash (genesis for
        the first block). Returns {"valid", "block_count", "first_break",
        "details": [{block_index, valid, hash_match, prev_match,
        expected_hash, stored_hash, trade_count, audit_count}]}.
        """
        stored = self.list_blocks()
        details: list[dict] = []
        first_break: int | None = None
        prev_block_hash: str | None = None
        for b in stored:
            idx = int(b["block_index"])
            expected, _, _ = self._expected_block_hash(idx, str(b["prev_hash"]))
            hash_match = (expected == str(b["block_hash"]))
            if prev_block_hash is None:
                prev_match = (str(b["prev_hash"]) == GENESIS_PREV_HASH)
            else:
                prev_match = (str(b["prev_hash"]) == prev_block_hash)
            valid = bool(hash_match and prev_match)
            if not valid and first_break is None:
                first_break = idx
            details.append(
                {
                    "block_index": idx,
                    "valid": valid,
                    "hash_match": bool(hash_match),
                    "prev_match": bool(prev_match),
                    "expected_hash": expected,
                    "stored_hash": str(b["block_hash"]),
                    "trade_count": int(b["trade_count"]),
                    "audit_count": int(b["audit_count"]),
                }
            )
            prev_block_hash = str(b["block_hash"])
        return {
            "valid": first_break is None,
            "block_count": len(stored),
            "first_break": first_break,
            "details": details,
        }

    def close(self) -> None:
        self.conn.close()
