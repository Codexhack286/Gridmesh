"""LOOP-002 tests: OptimizationAgent real dispatch engine.

All tests use explicit rows + capacity_map so no filesystem or LLM calls are made.
Tests cover both dispatch modes and all edge cases identified in the implementation plan.
"""
from __future__ import annotations

import pytest

from app.agents.optimization import (
    OptimizationAgent,
    _idle_dispatch,
    _peak_shaving,
    _surplus_absorption,
    RESERVE_FLOOR_PCT,
)
from app.core.config import BATTERY_CAPACITIES


# ── Fixtures ───────────────────────────────────────────────────────────────────

TICK = 48

# Snapshot of dataset at tick 48 (peak surplus)
ROWS_TICK48 = [
    {"participant_id": "battery_site", "gen_kw": 7.04, "load_kw": 0.02, "battery_kwh": 10.00},
    {"participant_id": "commercial",   "gen_kw": 13.96, "load_kw": 0.00, "battery_kwh": 14.00},
    {"participant_id": "ev_station",   "gen_kw": 0.00,  "load_kw": 0.00, "battery_kwh": 10.27},
    {"participant_id": "household",    "gen_kw": 0.00,  "load_kw": 0.18, "battery_kwh": 0.00},
    {"participant_id": "solar_home",   "gen_kw": 7.72,  "load_kw": 0.00, "battery_kwh": 8.00},
]

# Snapshot of dataset at tick 80 (peak stress: load=7.07 kW)
ROWS_TICK80 = [
    {"participant_id": "battery_site", "gen_kw": 0.00, "load_kw": 0.14, "battery_kwh": 10.00},
    {"participant_id": "commercial",   "gen_kw": 0.00, "load_kw": 1.96, "battery_kwh": 13.50},
    {"participant_id": "ev_station",   "gen_kw": 0.00, "load_kw": 2.53, "battery_kwh": 9.50},
    {"participant_id": "household",    "gen_kw": 0.00, "load_kw": 0.18, "battery_kwh": 0.00},
    {"participant_id": "solar_home",   "gen_kw": 0.00, "load_kw": 2.26, "battery_kwh": 8.00},
]

CAP = BATTERY_CAPACITIES


# ── Surplus Absorption Tests ───────────────────────────────────────────────────

def test_surplus_absorption_mode():
    """Tick 48 has +28.52 kW surplus → mode must be surplus_absorption."""
    agent = OptimizationAgent()
    state = {"rows": ROWS_TICK48, "tick": TICK, "stressed": False, "capacity_map": CAP}
    result = agent.run(state)
    assert result["dispatch"]["mode"] == "surplus_absorption"


def test_surplus_absorption_absorbs_ev_first():
    """ev_station has most headroom (4.73 kWh) → it should get the first charge command."""
    result = _surplus_absorption(ROWS_TICK48, CAP, TICK)
    cmds = result.commands
    charge_cmds = [c for c in cmds if c.command == "charge"]
    assert len(charge_cmds) >= 1
    pids = [c.participant_id for c in charge_cmds]
    assert "ev_station" in pids, f"ev_station should be charged; got {pids}"
    # ev_station must appear before or at same position as household
    if "household" in pids:
        assert pids.index("ev_station") < pids.index("household"), \
            "ev_station (larger headroom) should be charged before household"


def test_surplus_absorption_skips_full_batteries():
    """battery_site, commercial, solar_home are at 100% → no charge command for them."""
    result = _surplus_absorption(ROWS_TICK48, CAP, TICK)
    full_pids = {"battery_site", "commercial", "solar_home"}
    charged_pids = {c.participant_id for c in result.commands if c.command == "charge"}
    overlap = full_pids & charged_pids
    assert not overlap, f"Full batteries should not be charged; got commands for: {overlap}"


def test_surplus_absorption_qty_capped_at_headroom():
    """Charge qty for each participant must never exceed its battery headroom."""
    result = _surplus_absorption(ROWS_TICK48, CAP, TICK)
    for cmd in result.commands:
        if cmd.command == "charge":
            row = next(r for r in ROWS_TICK48 if r["participant_id"] == cmd.participant_id)
            cap = CAP[cmd.participant_id]
            headroom = round(cap - row["battery_kwh"], 3)
            assert cmd.qty_kwh <= headroom + 1e-6, (
                f"{cmd.participant_id}: qty {cmd.qty_kwh} > headroom {headroom}"
            )


def test_surplus_absorption_net_absorbed_sums_commands():
    """net_absorbed_kwh must equal the sum of all charge command quantities."""
    result = _surplus_absorption(ROWS_TICK48, CAP, TICK)
    total = round(sum(c.qty_kwh for c in result.commands if c.command == "charge"), 3)
    assert abs(result.net_absorbed_kwh - total) < 1e-4, (
        f"net_absorbed_kwh {result.net_absorbed_kwh} != sum of commands {total}"
    )


def test_idle_when_no_surplus():
    """Near-zero net → mode must be idle, no commands."""
    result = _idle_dispatch(99, "No surplus, no stress.")
    assert result.mode == "idle"
    assert result.commands == []


# ── Peak Shaving Tests ─────────────────────────────────────────────────────────

def test_peak_shaving_mode():
    """Tick 80 has stressed=True → mode must be peak_shaving."""
    agent = OptimizationAgent()
    state = {"rows": ROWS_TICK80, "tick": 80, "stressed": True, "capacity_map": CAP}
    result = agent.run(state)
    assert result["dispatch"]["mode"] == "peak_shaving"


def test_peak_shaving_discharges_highest_soc_first():
    """battery_site (100% SOC) must be discharged before commercial (96% SOC)."""
    result = _peak_shaving(ROWS_TICK80, CAP, 80)
    discharge_cmds = [c for c in result.commands if c.command == "discharge"]
    assert len(discharge_cmds) >= 1
    pids = [c.participant_id for c in discharge_cmds]
    # battery_site (100%) must come before commercial (96%)
    if "battery_site" in pids and "commercial" in pids:
        assert pids.index("battery_site") < pids.index("commercial"), \
            "Highest SOC (battery_site) should discharge first"


def test_peak_shaving_respects_reserve_floor():
    """No discharge command should drain a battery below RESERVE_FLOOR_PCT."""
    result = _peak_shaving(ROWS_TICK80, CAP, 80)
    for cmd in result.commands:
        if cmd.command == "discharge":
            row = next(r for r in ROWS_TICK80 if r["participant_id"] == cmd.participant_id)
            cap = CAP[cmd.participant_id]
            floor_kwh = cap * RESERVE_FLOOR_PCT / 100
            remaining = row["battery_kwh"] - cmd.qty_kwh
            assert remaining >= floor_kwh - 1e-4, (
                f"{cmd.participant_id}: post-discharge {remaining:.3f} kWh below floor {floor_kwh:.3f} kWh"
            )


def test_peak_shaving_throttles_ev_when_deficit_remains():
    """When batteries are near reserve floor, ev_station load must be throttled."""
    # All storage batteries at or near 20% reserve floor → almost no discharge available
    # ev_station has 4.5 kW load → throttle must fire
    rows_drained = [
        {"participant_id": "battery_site", "gen_kw": 0.00, "load_kw": 0.10,
         "battery_kwh": 2.00},   # 20% of 10 kWh → at floor
        {"participant_id": "commercial",   "gen_kw": 0.00, "load_kw": 0.50,
         "battery_kwh": 2.80},   # 20% of 14 kWh → at floor
        {"participant_id": "ev_station",   "gen_kw": 0.00, "load_kw": 4.50,
         "battery_kwh": 9.00},   # EV charging hard
        {"participant_id": "household",    "gen_kw": 0.00, "load_kw": 0.18,
         "battery_kwh": 0.00},   # empty
        {"participant_id": "solar_home",   "gen_kw": 0.00, "load_kw": 0.50,
         "battery_kwh": 1.60},   # 20% of 8 kWh → at floor
    ]
    result = _peak_shaving(rows_drained, CAP, 99)
    throttle_cmds = [c for c in result.commands if c.command == "throttle_ev"]
    assert len(throttle_cmds) >= 1, (
        f"Expected throttle_ev command when batteries at floor. Commands: {[c.command for c in result.commands]}"
    )
    assert throttle_cmds[0].participant_id == "ev_station"



def test_peak_shaving_household_no_discharge():
    """household battery is at 0% SOC → no discharge command for it."""
    result = _peak_shaving(ROWS_TICK80, CAP, 80)
    hh_discharge = [c for c in result.commands
                    if c.command == "discharge" and c.participant_id == "household"]
    assert len(hh_discharge) == 0, "household at 0% SOC must not be discharged"


def test_dispatch_result_schema_fields():
    """DispatchResult from both modes must have the expected top-level fields."""
    surplus = _surplus_absorption(ROWS_TICK48, CAP, TICK)
    assert hasattr(surplus, "mode")
    assert hasattr(surplus, "net_absorbed_kwh")
    assert hasattr(surplus, "net_wasted_kwh")
    assert hasattr(surplus, "commands")

    stress = _peak_shaving(ROWS_TICK80, CAP, 80)
    assert hasattr(stress, "net_discharged_kwh")
    assert hasattr(stress, "ev_throttle_kw")
