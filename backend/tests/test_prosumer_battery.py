"""LOOP-001 tests: battery-state-aware Prosumer Agent.

Tests are intentionally offline-safe — they use explicit capacity_map and preferences
in state so the agent never needs to read a file or call an LLM.
"""
from __future__ import annotations

import pytest

from app.agents.prosumer import ProsumerAgent, _parse_reserve, _parse_sell_threshold


# ── Helpers ────────────────────────────────────────────────────────────────────

def _state(pid: str, gen: float, load: float, battery_kwh: float, capacity: float, pref: str) -> dict:
    return {
        "tick": 1,
        "rows": [{"participant_id": pid, "gen_kw": gen, "load_kw": load, "battery_kwh": battery_kwh}],
        "capacity_map": {pid: capacity},
        "preferences": {pid: pref},
    }


# ── Preference parser tests ────────────────────────────────────────────────────

def test_parse_reserve_explicit():
    assert _parse_reserve("Keep 30% battery reserve") == 30.0


def test_parse_reserve_other_value():
    assert _parse_reserve("45% reserve please") == 45.0


def test_parse_reserve_default():
    assert _parse_reserve("no mention here at all") == 30.0


def test_parse_sell_threshold_explicit():
    assert _parse_sell_threshold("sell when battery above 80%") == 80.0


def test_parse_sell_threshold_short_form():
    assert _parse_sell_threshold("sell above 50%") == 50.0


# ── Three-tier logic tests ─────────────────────────────────────────────────────

def test_surplus_below_threshold_charges_battery():
    """SOC=50% < sell_threshold=80% → must store, not sell."""
    agent = ProsumerAgent()
    result = agent.run(_state(
        pid="solar_home", gen=5.0, load=1.0,
        battery_kwh=4.0, capacity=8.0,
        pref="Keep 30% battery reserve. Sell surplus when battery above 80%.",
    ))
    d = result["decisions"][0]
    assert d["action"] == "store", f"Expected 'store', got '{d['action']}'"
    assert d["battery_action"] == "charge"
    assert d["battery_soc_pct"] == pytest.approx(50.0)
    assert d["qty_kwh"] > 0


def test_deficit_buys():
    """Net deficit (load > gen) → action must be 'buy'."""
    agent = ProsumerAgent()
    result = agent.run(_state(
        pid="household", gen=0.0, load=2.0,
        battery_kwh=1.0, capacity=2.0,
        pref="Buy from P2P if available. Use grid as fallback.",
    ))
    d = result["decisions"][0]
    assert d["action"] == "buy"
    assert d["qty_kwh"] == pytest.approx(0.5)  # 2.0 kW * 0.25 h


def test_surplus_above_threshold_sells_or_holds():
    """SOC=90% > sell_threshold=80% → LLM/fallback decides; must be sell or store."""
    agent = ProsumerAgent()
    result = agent.run(_state(
        pid="battery_site", gen=8.0, load=0.5,
        battery_kwh=9.0, capacity=10.0,
        pref="Community buffer. Keep 40% reserve for evening discharge.",
    ))
    d = result["decisions"][0]
    assert d["action"] in {"sell", "store", "consume"}
    assert d["battery_soc_pct"] == pytest.approx(90.0)


def test_qty_capped_at_available_surplus():
    """Sell qty must never exceed (gen - load) * 0.25 kWh regardless of LLM output."""
    agent = ProsumerAgent()
    result = agent.run(_state(
        pid="commercial", gen=10.0, load=2.0,
        battery_kwh=13.0, capacity=14.0,
        pref="Aggressive arbitrage. Sell all surplus above 20% reserve.",
    ))
    d = result["decisions"][0]
    available = (10.0 - 2.0) * 0.25  # 2.0 kWh
    if d["action"] == "sell":
        assert d["qty_kwh"] <= available, (
            f"Qty {d['qty_kwh']} exceeds available surplus {available}"
        )


def test_idle_consumes_locally():
    """Near-zero net → action is 'consume', qty is 0."""
    agent = ProsumerAgent()
    result = agent.run(_state(
        pid="solar_home", gen=0.02, load=0.02,
        battery_kwh=5.0, capacity=8.0,
        pref="Keep 30% battery reserve. Sell surplus when battery above 80%.",
    ))
    d = result["decisions"][0]
    assert d["action"] == "consume"
    assert d["qty_kwh"] == 0.0


def test_battery_soc_in_decision_output():
    """battery_soc_pct must always be present and correctly computed."""
    agent = ProsumerAgent()
    result = agent.run(_state(
        pid="ev_station", gen=0.0, load=3.0,
        battery_kwh=7.5, capacity=15.0,
        pref="Charge to 90% by departure.",
    ))
    d = result["decisions"][0]
    assert "battery_soc_pct" in d
    assert d["battery_soc_pct"] == pytest.approx(50.0)  # 7.5 / 15.0 * 100


def test_preference_applied_truncated_in_output():
    """preference_applied field must be present and ≤ 80 chars."""
    agent = ProsumerAgent()
    pref = "Keep 30% battery reserve. Sell surplus when battery above 80%."
    result = agent.run(_state("solar_home", 5.0, 1.0, 4.0, 8.0, pref))
    d = result["decisions"][0]
    assert "preference_applied" in d
    assert len(d["preference_applied"]) <= 80
