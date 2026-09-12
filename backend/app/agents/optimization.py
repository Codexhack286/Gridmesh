"""Optimization Agent: real surplus-absorption and peak-shaving dispatch engine.

LOOP-002: replaces the one-line string stub with two concrete dispatch modes:

  surplus_absorption — Midday: greedy-fill batteries/EV with excess solar.
      Priority queue sorted by headroom (largest gap first).
      Charge rate capped at C/2 (capacity/2 kW) per participant.

  peak_shaving       — Evening stress (load > STRESS_THRESHOLD_KW):
      Step A: discharge highest-SOC batteries first, down to RESERVE_FLOOR_PCT.
      Step B: throttle ev_station to EV_THROTTLE_FACTOR of normal load.

  idle               — Net surplus < SURPLUS_MIN_KW and not stressed → do nothing.

Output is a DispatchResult (structured), placed in state["dispatch"].
ProsumerAgent reads state["dispatch"]["commands"] and honours overrides.
"""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.core import config
from app.core.schemas import DispatchCommand, DispatchResult

# ── Tuning constants ──────────────────────────────────────────────────────────
SURPLUS_MIN_KW = 1.0        # below this net surplus → idle, nothing to absorb
MAX_CHARGE_C = 0.5          # charge at C/2 rate  (kW = capacity * 0.5)
MAX_DISCHARGE_C = 0.5       # discharge at C/2 rate
RESERVE_FLOOR_PCT = 20.0    # never discharge a battery below this SOC %
EV_THROTTLE_FACTOR = 0.20   # allow only 20 % of normal EV draw during stress


# ── Internal helpers ──────────────────────────────────────────────────────────

def _idle_dispatch(tick: int, reason: str) -> DispatchResult:
    return DispatchResult(tick=tick, mode="idle", rationale=reason)


def _surplus_absorption(rows: list[dict], cap_map: dict[str, float], tick: int) -> DispatchResult:
    """Route midday surplus into batteries/EV using a greedy headroom-first queue."""
    net_kw = sum(float(r["gen_kw"]) - float(r["load_kw"]) for r in rows)
    if net_kw < SURPLUS_MIN_KW:
        return _idle_dispatch(
            tick, f"Net {net_kw:+.2f} kW — below absorption threshold {SURPLUS_MIN_KW} kW."
        )

    remaining_kwh = round(net_kw * 0.25, 3)   # 15-min tick energy
    original_surplus_kwh = remaining_kwh
    commands: list[DispatchCommand] = []
    absorbed = 0.0

    # Build candidates sorted by headroom descending (greedy fill)
    candidates = sorted(
        rows,
        key=lambda r: cap_map.get(r["participant_id"], 10.0) - float(r.get("battery_kwh", 0.0)),
        reverse=True,
    )

    for r in candidates:
        if remaining_kwh < 0.005:
            break
        pid = r["participant_id"]
        bat_kwh = float(r.get("battery_kwh", 0.0))
        cap = cap_map.get(pid, 10.0)
        headroom = round(cap - bat_kwh, 3)
        if headroom < 0.005:
            continue  # battery full — skip

        max_charge_kw = cap * MAX_CHARGE_C
        max_charge_kwh = round(max_charge_kw * 0.25, 3)
        qty = round(min(headroom, remaining_kwh, max_charge_kwh), 3)
        if qty <= 0:
            continue

        commands.append(
            DispatchCommand(
                participant_id=pid,
                command="charge",
                qty_kwh=qty,
                rate_kw=round(qty / 0.25, 2),
                rationale=(
                    f"Absorbing {qty:.3f} kWh of midday surplus into {pid}. "
                    f"Battery {bat_kwh:.2f}/{cap:.1f} kWh "
                    f"({bat_kwh / cap * 100:.0f}% SOC, headroom {headroom:.2f} kWh). "
                    f"Charge rate {qty/0.25:.2f} kW (C/2 cap {max_charge_kw:.1f} kW)."
                ),
            )
        )
        remaining_kwh = round(remaining_kwh - qty, 3)
        absorbed = round(absorbed + qty, 3)

    wasted = round(max(0.0, remaining_kwh), 3)
    return DispatchResult(
        tick=tick,
        mode="surplus_absorption",
        commands=commands,
        net_absorbed_kwh=absorbed,
        net_wasted_kwh=wasted,
        rationale=(
            f"Surplus {net_kw:.2f} kW ({original_surplus_kwh:.3f} kWh/tick). "
            f"Absorbed {absorbed:.3f} kWh into {len(commands)} participant(s). "
            f"Unabsorbed (all-full): {wasted:.3f} kWh."
        ),
    )


def _peak_shaving(rows: list[dict], cap_map: dict[str, float], tick: int) -> DispatchResult:
    """Discharge highest-SOC batteries then throttle EV to cover evening demand deficit."""
    deficit_kw = sum(float(r["load_kw"]) - float(r["gen_kw"]) for r in rows)
    commands: list[DispatchCommand] = []
    discharged = 0.0
    ev_throttle_kw = 0.0
    remaining_deficit_kw = deficit_kw

    # Step A — Battery discharge (exclude ev_station, it's a load node not storage)
    storage_rows = [r for r in rows if r["participant_id"] != "ev_station"]
    discharge_candidates = sorted(
        storage_rows,
        key=lambda r: float(r["battery_kwh"]) / cap_map.get(r["participant_id"], 10.0),
        reverse=True,   # highest SOC first
    )

    for r in discharge_candidates:
        if remaining_deficit_kw <= 0.05:
            break
        pid = r["participant_id"]
        bat_kwh = float(r.get("battery_kwh", 0.0))
        cap = cap_map.get(pid, 10.0)
        soc_pct = bat_kwh / cap * 100
        floor_kwh = round(cap * RESERVE_FLOOR_PCT / 100, 3)
        available_kwh = round(max(0.0, bat_kwh - floor_kwh), 3)
        if available_kwh < 0.005:
            continue

        max_discharge_kw = cap * MAX_DISCHARGE_C
        max_discharge_kwh = round(max_discharge_kw * 0.25, 3)
        qty = round(min(available_kwh, remaining_deficit_kw * 0.25, max_discharge_kwh), 3)
        if qty <= 0:
            continue

        post_soc_pct = round((bat_kwh - qty) / cap * 100, 1)
        commands.append(
            DispatchCommand(
                participant_id=pid,
                command="discharge",
                qty_kwh=qty,
                rate_kw=round(qty / 0.25, 2),
                rationale=(
                    f"Peak shaving: discharging {qty:.3f} kWh from {pid} into feeder. "
                    f"SOC {soc_pct:.0f}% -> {post_soc_pct:.1f}% "
                    f"(reserve floor {RESERVE_FLOOR_PCT:.0f}%, "
                    f"available {available_kwh:.3f} kWh)."
                ),
            )
        )
        remaining_deficit_kw = round(remaining_deficit_kw - qty / 0.25, 3)
        discharged = round(discharged + qty, 3)

    # Step B — EV throttle if deficit still significant
    ev_rows = [r for r in rows if r["participant_id"] == "ev_station"]
    for r in ev_rows:
        if remaining_deficit_kw <= 0.05:
            break
        normal_load_kw = float(r["load_kw"])
        if normal_load_kw < 0.01:
            continue   # EV not actively charging — nothing to throttle
        throttled_kw = round(normal_load_kw * EV_THROTTLE_FACTOR, 3)
        freed_kw = round(normal_load_kw - throttled_kw, 3)
        ev_throttle_kw = round(ev_throttle_kw + freed_kw, 3)
        commands.append(
            DispatchCommand(
                participant_id="ev_station",
                command="throttle_ev",
                qty_kwh=round(freed_kw * 0.25, 3),
                rate_kw=freed_kw,
                rationale=(
                    f"Grid stress: throttling ev_station from {normal_load_kw:.2f} kW "
                    f"to {throttled_kw:.2f} kW ({int(EV_THROTTLE_FACTOR*100)}% of normal), "
                    f"freeing {freed_kw:.2f} kW for the feeder."
                ),
            )
        )
        remaining_deficit_kw = round(remaining_deficit_kw - freed_kw, 3)

    residual = round(max(0.0, remaining_deficit_kw), 3)
    return DispatchResult(
        tick=tick,
        mode="peak_shaving",
        commands=commands,
        net_discharged_kwh=discharged,
        ev_throttle_kw=ev_throttle_kw,
        rationale=(
            f"Peak shaving: demand deficit {deficit_kw:.2f} kW. "
            f"Discharged {discharged:.3f} kWh from {sum(1 for c in commands if c.command == 'discharge')} battery(s). "
            f"EV throttled {ev_throttle_kw:.2f} kW. "
            f"Residual deficit after dispatch: {residual:.2f} kW."
        ),
    )


# ── Agent ─────────────────────────────────────────────────────────────────────

class OptimizationAgent(BaseAgent):
    name = "optimization"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        rows = state.get("rows", [])
        tick = state.get("tick", 0)
        stressed: bool = state.get("stressed", False)
        cap_map: dict[str, float] = state.get("capacity_map", config.BATTERY_CAPACITIES)

        if stressed:
            result = _peak_shaving(rows, cap_map, tick)
        else:
            net_kw = sum(float(r["gen_kw"]) - float(r["load_kw"]) for r in rows)
            if net_kw >= SURPLUS_MIN_KW:
                result = _surplus_absorption(rows, cap_map, tick)
            else:
                result = _idle_dispatch(
                    tick,
                    f"Net {net_kw:+.2f} kW — no stress, no significant surplus. Idle.",
                )

        return {"dispatch": result.model_dump()}
