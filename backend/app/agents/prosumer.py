"""Prosumer Agent: battery-aware, preference-driven buy/sell/store/consume per participant.

LOOP-001: reads battery_kwh, computes SOC, applies a three-tier decision tree shaped by
          each participant's natural-language preference string.
LOOP-002: honours OptimizationAgent dispatch overrides before running its own tier logic.
          If OptimizationAgent issued a charge/discharge/throttle_ev command for a
          participant this tick, that command takes precedence (grid > individual).

Decision priority (LOOP-002+):
  0. Dispatch override from OptimizationAgent (if present) → use directly
  1. Net deficit  → buy from P2P market (deterministic)
  2. Net surplus + SOC < sell_threshold → charge battery first (deterministic)
  3. Net surplus + SOC >= sell_threshold → LLM decides sell qty (with cached fallback)
  4. Idle (~0 net) → consume locally
"""
from __future__ import annotations

import re
from typing import Any

from app.agents.base import BaseAgent
from app.core import config
from app.core.schemas import ProsumerDecision
from app.llm.client import complete_json


# ── Preference parsers ─────────────────────────────────────────────────────────

def _parse_reserve(text: str, default: float = 30.0) -> float:
    """Extract reserve % from free-text. 'Keep 30% battery reserve' → 30.0"""
    v = parse_reserve_or_none(text)
    return v if v is not None else default


def parse_reserve_or_none(text: str) -> float | None:
    """Extract reserve % or None when the preference states no explicit reserve.

    Lets peak-shaving fall back to the global floor instead of the
    prosumer-tier default.
    """
    m = re.search(r"(\d+(?:\.\d+)?)\s*%\s*(?:battery\s*)?reserve", text, re.I)
    return float(m.group(1)) if m else None


def _parse_sell_threshold(text: str, default: float = 80.0) -> float:
    """Extract sell-above % from free-text. 'sell when battery above 80%' → 80.0"""
    m = re.search(r"(?:sell|above)\s+(?:above\s+)?(\d+)\s*%", text, re.I)
    return float(m.group(1)) if m else default


# ── Dispatch override helper (LOOP-002) ────────────────────────────────────────

def _find_dispatch_override(pid: str, dispatch: dict) -> dict | None:
    """Return the DispatchCommand dict for this participant if OptimizationAgent issued one.

    Returns None if no override exists, so the normal tier logic runs.
    """
    for cmd in dispatch.get("commands", []):
        if cmd["participant_id"] == pid:
            return cmd
    return None


# ── Agent ──────────────────────────────────────────────────────────────────────

class ProsumerAgent(BaseAgent):
    name = "prosumer"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        rows = state.get("rows", [])
        tick = state.get("tick", 0)
        cap_map: dict[str, float] = state.get("capacity_map", config.BATTERY_CAPACITIES)
        prefs_map: dict[str, str] = state.get("preferences", config.DEFAULT_PREFERENCES)

        decisions = []
        dispatch = state.get("dispatch", {})   # LOOP-002: commands from OptimizationAgent

        for r in rows:
            pid = r["participant_id"]
            gen_kw = float(r.get("gen_kw", 0.0))
            load_kw = float(r.get("load_kw", 0.0))
            battery_kwh = float(r.get("battery_kwh", 0.0))

            # Compute SOC (always needed, even for override path)
            capacity = cap_map.get(pid, 10.0)
            battery_soc = round((battery_kwh / capacity) * 100.0, 1) if capacity > 0 else 0.0

            # ── Dispatch override (LOOP-002) ───────────────────────────────────
            override = _find_dispatch_override(pid, dispatch)
            if override:
                cmd = override["command"]
                # Map throttle_ev → consume (load reduction, not a buy/sell action)
                action = cmd if cmd != "throttle_ev" else "consume"
                decisions.append(
                    ProsumerDecision(
                        participant_id=pid,
                        tick=tick,
                        action=action,
                        qty_kwh=float(override["qty_kwh"]),
                        rationale=f"[OptimizationAgent override] {override.get('rationale', cmd)}",
                        battery_soc_pct=battery_soc,
                        battery_action=cmd,
                        preference_applied="dispatch_override",
                    ).model_dump()
                )
                continue   # skip tier logic for this participant

            # Parse preference
            pref_text = prefs_map.get(pid, "Keep 30% battery reserve. Sell surplus when battery above 80%.")
            reserve_pct = _parse_reserve(pref_text)
            sell_threshold_pct = _parse_sell_threshold(pref_text)

            net_kw = gen_kw - load_kw
            tick_kwh = round(net_kw * 0.25, 3)  # 15-min interval

            # ── Tier 1: Net deficit ────────────────────────────────────────────
            if net_kw < -0.05:
                action = "buy"
                qty = round(abs(tick_kwh), 3)
                battery_action = "hold"
                rationale = (
                    f"Net deficit {net_kw:+.2f} kW (gen {gen_kw:.2f} kW, load {load_kw:.2f} kW). "
                    f"Battery SOC {battery_soc:.1f}% (reserve floor {reserve_pct:.0f}%). "
                    f"Requesting {qty} kWh from P2P market."
                )

            # ── Tier 2: Surplus but battery below sell threshold → charge ──────
            elif net_kw > 0.05 and battery_soc < sell_threshold_pct:
                headroom = round((capacity - battery_kwh), 3)
                if headroom > 0.01:
                    action = "store"
                    qty = round(min(tick_kwh, headroom), 3)
                    battery_action = "charge"
                    rationale = (
                        f"Net surplus {net_kw:+.2f} kW. Battery SOC {battery_soc:.1f}% "
                        f"below sell threshold {sell_threshold_pct:.0f}% "
                        f"(reserve floor {reserve_pct:.0f}%). "
                        f"Charging {qty} kWh into battery (headroom {headroom:.2f} kWh). "
                        f"Preference: '{pref_text[:70]}...'"
                    )
                else:
                    # Battery full — just self-consume
                    action = "consume"
                    qty = 0.0
                    battery_action = "hold"
                    rationale = (
                        f"Battery near full ({battery_soc:.1f}%). "
                        f"Surplus {net_kw:+.2f} kW self-consumed locally."
                    )

            # ── Tier 3: Surplus and SOC above sell threshold → LLM sell ───────
            elif net_kw > 0.05 and battery_soc >= sell_threshold_pct:
                available_kwh = round(tick_kwh, 3)
                out = complete_json(
                    f"Participant '{pid}' has net surplus {net_kw:.2f} kW "
                    f"({gen_kw:.2f} kW gen, {load_kw:.2f} kW load). "
                    f"Battery SOC {battery_soc:.1f}% (capacity {capacity} kWh). "
                    f"Reserve floor {reserve_pct:.0f}%, sell threshold {sell_threshold_pct:.0f}%. "
                    f"Available to sell this 15-min tick: {available_kwh} kWh. "
                    f"User preference: '{pref_text}'. "
                    "Reply as JSON: {action, qty_kwh, battery_action, rationale}.",
                    "prosumer",
                )
                action = str(out.get("action", "sell"))
                raw_qty = float(out.get("qty_kwh", available_kwh))
                qty = round(min(raw_qty, available_kwh), 3)  # hard cap: can't sell more than surplus
                battery_action = str(out.get("battery_action", "hold"))
                raw_rationale = str(out.get(
                    "rationale",
                    f"SOC {battery_soc:.1f}% >= threshold {sell_threshold_pct:.0f}%. "
                    f"Selling {qty:.3f} kWh at P2P market rate.",
                ))
                # Offline/cached fallback text is static ("80%"/"30%") — regenerate
                # with this participant's ACTUAL thresholds so the log is honest.
                # Live LLM prose never starts with "Cached fallback", so it passes
                # through untouched.
                if raw_rationale.startswith("Cached fallback"):
                    rationale = (
                        f"Cached fallback: battery SOC above sell threshold "
                        f"({sell_threshold_pct:.0f}%). "
                        f"Reserve floor ({reserve_pct:.0f}%) is satisfied. "
                        f"Selling {qty} kWh surplus at P2P market rate."
                    )
                else:
                    rationale = raw_rationale

            # ── Tier 4: Idle ───────────────────────────────────────────────────
            else:
                action = "consume"
                qty = 0.0
                battery_action = "hold"
                rationale = (
                    f"Net ≈ 0 kW (gen {gen_kw:.2f} kW, load {load_kw:.2f} kW). "
                    f"Idle. Battery SOC {battery_soc:.1f}%."
                )

            decisions.append(
                ProsumerDecision(
                    participant_id=pid,
                    tick=tick,
                    action=action,
                    qty_kwh=qty,
                    rationale=rationale,
                    battery_soc_pct=battery_soc,
                    battery_action=battery_action,
                    preference_applied=pref_text[:80],
                ).model_dump()
            )

        return {"decisions": decisions}
