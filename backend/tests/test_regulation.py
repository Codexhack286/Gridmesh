"""BUG-001 tests: 5-rule RegulationAgent + Rogue Bid Injector scenarios.

All tests are offline-safe — no LLM calls required for flagged trades
(deterministic rules fire before the LLM path).
"""
from __future__ import annotations

import pytest

from app.agents.regulation import RegulationAgent, RULES, _audit_single
from app.api.violation_log import VIOLATION_LOG
from app.core import config


# ── Helpers ────────────────────────────────────────────────────────────────────

def _run(trades: list[dict], tick: int = 1) -> list[dict]:
    total_kwh = sum(float(t.get("qty_kwh", 0)) for t in trades)
    return [_audit_single(t, i, tick, total_kwh) for i, t in enumerate(trades)]


def _trade(
    qty: float = 0.5,
    price: float = 0.255,
    buyer: str = "household",
    seller: str = "solar_home",
) -> dict:
    return {
        "buyer_id": buyer,
        "seller_id": seller,
        "qty_kwh": qty,
        "clearing_price": price,
        "rationale": "test trade",
        "tick": 1,
    }


@pytest.fixture(autouse=True)
def _reset_log():
    """Clear ViolationLog before each test to avoid cross-test pollution."""
    VIOLATION_LOG.clear()
    yield
    VIOLATION_LOG.clear()


# ── R-00: Clean trade passes ───────────────────────────────────────────────────

def test_clean_trade_passes():
    """Normal P2P trade: price=0.255, qty=0.5 → should pass all rules."""
    audits = _run([_trade(qty=0.5, price=0.255)])
    assert audits[0]["passed"] is True
    assert audits[0]["flag"] == ""


# ── R-01: Price collar ─────────────────────────────────────────────────────────

def test_r01_price_collar_flags():
    """Price 0.45 $/kWh > cap 0.30 $/kWh → predatory_price_collar."""
    audits = _run([_trade(price=0.45)])
    assert audits[0]["passed"] is False
    assert audits[0]["flag"] == "predatory_price_collar"
    assert audits[0]["rule_id"] == "R-01"
    assert audits[0]["severity"] == "critical"
    assert audits[0]["enforcement"] == "void_trade"


def test_r01_price_exactly_at_cap_passes():
    """Price == PRICE_CAP (not strictly greater) → should pass."""
    audits = _run([_trade(price=config.PRICE_CAP)])
    assert audits[0]["passed"] is True


# ── R-02: Quantity cap ─────────────────────────────────────────────────────────

def test_r02_quantity_cap_flags():
    """qty=10.5 kWh > QTY_CAP=10 → quantity_cap_breach.

    Call _audit_single directly with total_tick_kwh forced to 0 so R-05
    (feeder overload) does not shadow R-02 (per-trade quantity cap).
    """
    trade = _trade(qty=10.5, price=0.255)
    # total_tick_kwh=0 bypasses R-05 so R-02 fires cleanly
    audit = _audit_single(trade, 0, 1, total_tick_kwh=0.0)
    assert audit["passed"] is False
    assert audit["flag"] == "quantity_cap_breach", (
        f"Expected quantity_cap_breach, got {audit['flag']}"
    )
    assert audit["rule_id"] == "R-02"
    assert audit["enforcement"] == "void_trade"



# ── R-03: Self-trade ──────────────────────────────────────────────────────────

def test_r03_self_trade_flags():
    """buyer_id == seller_id → self_trade_loop."""
    audits = _run([_trade(buyer="solar_home", seller="solar_home")])
    assert audits[0]["passed"] is False
    assert audits[0]["flag"] == "self_trade_loop"
    assert audits[0]["rule_id"] == "R-03"


# ── R-04: Collusion signal ────────────────────────────────────────────────────

def test_r04_collusion_signal_flags():
    """price=0.29 > 0.28 AND qty=3.5 > 3.0 → price_qty_collusion_signal."""
    audits = _run([_trade(qty=3.5, price=0.29)])
    assert audits[0]["passed"] is False
    assert audits[0]["flag"] == "price_qty_collusion_signal"
    assert audits[0]["rule_id"] == "R-04"
    assert audits[0]["severity"] == "warning"
    assert audits[0]["enforcement"] == "alert"


def test_r04_only_high_price_no_flag():
    """price=0.29 but qty=1.0 (below qty floor) → should pass (not collusion)."""
    audits = _run([_trade(qty=1.0, price=0.29)])
    assert audits[0]["passed"] is True


# ── R-05: Feeder overload ─────────────────────────────────────────────────────

def test_r05_feeder_overload_flags_all_trades():
    """3 trades totalling 10 kWh > FEEDER_CAP 8 kWh → all flagged feeder_overload."""
    trades = [
        _trade(qty=4.0, price=0.255, buyer="ev_station",   seller="solar_home"),
        _trade(qty=3.5, price=0.255, buyer="household",    seller="commercial"),
        _trade(qty=2.5, price=0.255, buyer="battery_site", seller="solar_home"),
    ]
    audits = _run(trades)
    assert all(a["passed"] is False for a in audits)
    assert all(a["flag"] == "feeder_overload" for a in audits)
    assert all(a["rule_id"] == "R-05" for a in audits)


def test_r05_below_feeder_cap_passes():
    """2 trades totalling 5 kWh < FEEDER_CAP 8 kWh → no feeder flag."""
    trades = [
        _trade(qty=2.5, price=0.255, buyer="ev_station", seller="solar_home"),
        _trade(qty=2.5, price=0.255, buyer="household",  seller="commercial"),
    ]
    audits = _run(trades)
    assert all(a["passed"] is True for a in audits)


# ── Rule priority ──────────────────────────────────────────────────────────────

def test_r01_takes_priority_over_r04():
    """price=0.45 AND qty=3.5 → R-01 fires (price collar), not R-04 (collusion)."""
    audits = _run([_trade(qty=3.5, price=0.45)])
    assert audits[0]["rule_id"] == "R-01", (
        f"Expected R-01 to take priority over R-04, got {audits[0]['rule_id']}"
    )
    assert audits[0]["flag"] == "predatory_price_collar"


# ── Enforcement actions ───────────────────────────────────────────────────────

def test_critical_severity_has_void_enforcement():
    """R-01, R-02, R-03 are critical → enforcement must be void_trade."""
    for trade in [
        _trade(price=0.45),              # R-01
        _trade(qty=12.0, price=0.255),   # R-02
        _trade(buyer="x", seller="x"),   # R-03
    ]:
        audits = _run([trade])
        assert audits[0]["enforcement"] == "void_trade", (
            f"Expected void_trade, got {audits[0]['enforcement']} for {audits[0]['flag']}"
        )


def test_warning_severity_has_alert_enforcement():
    """R-04 is warning → enforcement must be alert (not void)."""
    audits = _run([_trade(qty=3.5, price=0.29)])
    assert audits[0]["severity"] == "warning"
    assert audits[0]["enforcement"] == "alert"


# ── ViolationLog integration ──────────────────────────────────────────────────

def test_violation_log_appends_on_flag():
    """Flagged trade must add one entry to VIOLATION_LOG."""
    before = VIOLATION_LOG.count()
    _run([_trade(price=0.45)])
    assert VIOLATION_LOG.count() == before + 1


def test_clean_trade_does_not_append_violation_log():
    """Clean trade must NOT add to VIOLATION_LOG."""
    before = VIOLATION_LOG.count()
    _run([_trade(qty=0.5, price=0.255)])
    assert VIOLATION_LOG.count() == before


# ── Full RegulationAgent integration ─────────────────────────────────────────

def test_regulation_agent_run_returns_audits():
    """RegulationAgent.run() must return a dict with 'audits' list."""
    agent = RegulationAgent()
    state = {
        "trades": [_trade(), _trade(price=0.45)],
        "tick": 42,
    }
    result = agent.run(state)
    assert "audits" in result
    assert len(result["audits"]) == 2
    # First clean trade passes; second (price=0.45) fails
    assert result["audits"][0]["passed"] is True
    assert result["audits"][1]["passed"] is False
    assert result["audits"][1]["flag"] == "predatory_price_collar"
