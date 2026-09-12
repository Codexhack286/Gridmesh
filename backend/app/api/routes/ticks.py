"""Tick route: advance sim clock, run LangGraph pipeline, ledger trades."""
from __future__ import annotations

from fastapi import APIRouter

from app.agents.graph import run_tick
from app.agents.optimization import _reserve_floor_pct
from app.core import config
from app.core.clock import SimClock
from app.data.opsd_loader import load_default
from app.data.replay import Replay
from app.ledger.table import LEDGER

router = APIRouter()
CLOCK = SimClock()

DF = load_default()
REPLAY = Replay(DF)


@router.post("/tick")
def tick() -> dict:
    tick_n = CLOCK.advance()
    rows = REPLAY.tick_rows(tick_n).to_dict(orient="records")
    # Agents are pure compute (forecasts/decisions/dispatch for the response),
    # so they always run. DB writes below are gated on the replay check.
    state = run_tick(rows, tick_n)
    if LEDGER.has_block(tick_n):
        # Replay (e.g. clock reset after a restart): this tick was already
        # closed. Read the persisted result back from the DB — durable across
        # restarts, unlike any in-memory cache — instead of re-inserting
        # duplicate trade/audit rows (which would break verify_chain).
        # VIOLATION_LOG re-populates naturally via run_tick above when needed.
        stored = LEDGER.get_trades_for_tick(tick_n)
        audits = LEDGER.get_audits_for_tick(tick_n)
    else:
        stored = [LEDGER.append(t) for t in state.get("trades", [])]
        # Persist EVERY audit (pass + flag) so the audits table survives restarts
        # and Phase 4 hash-chaining has full history. VIOLATION_LOG stays as the
        # live session cache (flagged only); DB is the durable source of truth.
        audits = [LEDGER.append_audit(a) for a in state.get("audits", [])]
    # Close the tick's block AFTER trades+audits are written, so the hash is
    # provably over fully-persisted DB rows (re-read inside close_block).
    # Idempotent: returns the existing block on replay. Rogue bids never mint
    # blocks (synthetic tick numbers, not canonical).
    block = LEDGER.close_block(tick_n)
    decision_log = [
        {"agent": "forecasting", "tick": tick_n, "action": f"{len(state.get('forecasts', []))} forecasts",
         "rationale": "Seasonal-naive replay forecast per participant."},
        {"agent": "grid_health", "tick": tick_n,
         "action": "stress" if state.get("stressed") else "normal",
         "rationale": state.get("stress", {}).get("rationale", "")},
        {"agent": "optimization", "tick": tick_n,
         "action": (
             f"{state.get('dispatch', {}).get('mode', 'idle')} "
             f"abs={state.get('dispatch', {}).get('net_absorbed_kwh', 0):.2f}kWh "
             f"dis={state.get('dispatch', {}).get('net_discharged_kwh', 0):.2f}kWh "
             f"({len(state.get('dispatch', {}).get('commands', []))} cmds)"
         ),
         "rationale": state.get("dispatch", {}).get("rationale", "")},
        *[
            {"agent": "prosumer", "tick": tick_n,
             "action": (
                 f"{d['participant_id']}:{d['action']} {d['qty_kwh']} kWh "
                 f"[bat:{d.get('battery_soc_pct', 0):.0f}% {d.get('battery_action', 'hold')}]"
             ),
             "rationale": d.get("rationale", "")}
            for d in state.get("decisions", [])
        ],
        *[
            {"agent": "trading", "tick": tick_n,
             "action": f"{t['seller_id']}->{t['buyer_id']} {t['qty_kwh']} kWh @ {t['clearing_price']}",
             "rationale": t.get("rationale", "")}
            for t in state.get("trades", [])
        ],
        *[
            {"agent": "regulation", "tick": tick_n,
              "action": (
                  f"trade#{a['trade_index']} "
                  + (
                      f"PASS [{a.get('rule_id', 'llm')}]"
                      if a["passed"]
                      else (
                          f"FLAG:{a['flag']} "
                          f"[{a.get('rule_id', '?')}] "
                          f"({a.get('severity', 'info')}) "
                          f"-> {a.get('enforcement', 'none')}"
                      )
                  )
              ),
              "rationale": a.get("rationale", "")}
            for a in audits
        ],
    ]
    return {
        "tick": tick_n,
        "forecasts": state.get("forecasts", []),
        "stress": state.get("stress", {}),
        "dispatch": state.get("dispatch", {}),
        "dispatch_commands": state.get("dispatch", {}).get("commands", []),
        "net_absorbed_kwh": state.get("dispatch", {}).get("net_absorbed_kwh", 0),
        "net_discharged_kwh": state.get("dispatch", {}).get("net_discharged_kwh", 0),
        "net_wasted_kwh": state.get("dispatch", {}).get("net_wasted_kwh", 0),
        "decisions": state.get("decisions", []),
        "battery_states": [
            {
                "participant_id": d["participant_id"],
                "battery_soc_pct": d.get("battery_soc_pct", 0),
                "battery_action": d.get("battery_action", "hold"),
                "preference_applied": d.get("preference_applied", ""),
                # Per-participant discharge floor (Fix 1): parsed reserve_pct,
                # else the global default. Single source: optimization helper.
                "reserve_floor_pct": _reserve_floor_pct(
                    d["participant_id"],
                    state.get("preferences", config.DEFAULT_PREFERENCES),
                ),
            }
            for d in state.get("decisions", [])
        ],
        "trades": stored,
        "audits": audits,
        "block": block,
        "violation_count": sum(
            1 for a in audits if not a.get("passed", True)
        ),
        "decision_log": decision_log,
    }
