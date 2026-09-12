"""Tests for SQLiteLedger (LOOP-003).

Uses an isolated in-memory SQLite database (:memory:) so tests never touch
the production gridmesh.db file and remain perfectly fast and concurrent.
"""
from __future__ import annotations

import sqlite3

import pytest

from app.ledger.sqlite_ledger import SQLiteLedger


@pytest.fixture
def ledger():
    """Provides a fresh, isolated in-memory SQLiteLedger for each test."""
    lg = SQLiteLedger(db_path=":memory:")
    yield lg
    lg.close()


def _trade(tick=1, qty=1.5, price=0.25) -> dict:
    return {
        "tick": tick,
        "buyer_id": "b1",
        "seller_id": "s1",
        "qty_kwh": qty,
        "clearing_price": price,
        "rationale": "test",
    }


# ── Trade appending and listing ───────────────────────────────────────────────

def test_append_stores_trade(ledger: SQLiteLedger):
    """An appended trade must survive and be returned by list()."""
    t = _trade()
    res = ledger.append(t)
    assert res["index"] > 0
    assert res["qty_kwh"] == t["qty_kwh"]

    rows = ledger.list()
    assert len(rows) == 1
    assert rows[0]["id"] == res["index"]
    assert rows[0]["qty_kwh"] == t["qty_kwh"]


def test_list_returns_all_in_order(ledger: SQLiteLedger):
    """list() must return trades ordered by ID (insertion order)."""
    ledger.append(_trade(tick=10))
    ledger.append(_trade(tick=11))
    ledger.append(_trade(tick=12))
    
    rows = ledger.list()
    assert len(rows) == 3
    assert [r["tick"] for r in rows] == [10, 11, 12]


# ── SQL Stats aggregation ─────────────────────────────────────────────────────

def test_stats_zero_on_empty(ledger: SQLiteLedger):
    """Empty DB must return 0 for all stats (using COALESCE in SQL)."""
    stats = ledger.stats()
    assert stats["total_trades"] == 0
    assert stats["total_kwh"] == 0.0
    assert stats["total_value_usd"] == 0.0


def test_stats_sum_kwh_and_value(ledger: SQLiteLedger):
    """stats() must correctly sum qty_kwh and qty * price."""
    ledger.append(_trade(qty=2.0, price=0.30))  # value = 0.60
    ledger.append(_trade(qty=3.0, price=0.20))  # value = 0.60
    
    stats = ledger.stats()
    assert stats["total_trades"] == 2
    assert stats["total_kwh"] == pytest.approx(5.0)
    assert stats["total_value_usd"] == pytest.approx(1.20)


def test_stats_min_max_ticks(ledger: SQLiteLedger):
    """stats() must find the first and last tick."""
    ledger.append(_trade(tick=42))
    ledger.append(_trade(tick=99))
    
    stats = ledger.stats()
    assert stats["first_tick"] == 42
    assert stats["last_tick"] == 99


# ── Audits and Hashes ─────────────────────────────────────────────────────────

def test_append_audit_with_hash(ledger: SQLiteLedger):
    """append_audit() must inject a 16-char SHA-256 hash into the DB."""
    audit = {
        "tick": 42,
        "trade_index": 0,
        "passed": False,
        "flag": "test_flag",
        "rationale": "because",
        "severity": "info",
        "enforcement": "none",
        "rule_id": "R-01",
    }
    res = ledger.append_audit(audit)
    assert "audit_hash" in res
    assert len(res["audit_hash"]) == 16
    
    hashes = ledger.get_audit_hashes()
    assert len(hashes) == 1
    assert hashes[0] == res["audit_hash"]


def test_audit_hash_is_deterministic(ledger: SQLiteLedger):
    """The same audit data must produce the exact same hash."""
    audit = {"tick": 1, "trade_index": 2, "flag": "F", "rationale": "R"}
    h1 = ledger.append_audit(audit)["audit_hash"]
    h2 = ledger.append_audit(audit)["audit_hash"]
    assert h1 == h2


def test_audit_hash_changes_on_flag(ledger: SQLiteLedger):
    """Different audit data must produce a different hash."""
    audit1 = {"tick": 1, "trade_index": 2, "flag": "F1", "rationale": "R"}
    audit2 = {"tick": 1, "trade_index": 2, "flag": "F2", "rationale": "R"}
    h1 = ledger.append_audit(audit1)["audit_hash"]
    h2 = ledger.append_audit(audit2)["audit_hash"]
    assert h1 != h2


# ── Persistence across instances ──────────────────────────────────────────────

def test_persists_across_instances(tmp_path):
    """A real file-backed ledger must survive being closed and reopened."""
    db_file = tmp_path / "test.db"
    
    # Instance 1: write
    lg1 = SQLiteLedger(str(db_file))
    lg1.append(_trade(qty=7.5))
    lg1.close()
    
    # Instance 2: read
    lg2 = SQLiteLedger(str(db_file))
    rows = lg2.list()
    lg2.close()
    
    assert len(rows) == 1
    assert rows[0]["qty_kwh"] == 7.5
