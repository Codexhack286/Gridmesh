"""Tick route: advance sim clock, run LangGraph pipeline, ledger trades."""
from __future__ import annotations

from fastapi import APIRouter

from app.agents.graph import run_tick
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
    state = run_tick(rows, tick_n)
    stored = [LEDGER.append(t) for t in state.get("trades", [])]
    decision_log = [
        {"agent": "forecasting", "tick": tick_n, "action": f"{len(state.get('forecasts', []))} forecasts",
         "rationale": "Seasonal-naive replay forecast per participant."},
        {"agent": "grid_health", "tick": tick_n,
         "action": "stress" if state.get("stressed") else "normal",
         "rationale": state.get("stress", {}).get("rationale", "")},
        {"agent": "optimization", "tick": tick_n,
         "action": state.get("dispatch", {}).get("action", ""),
         "rationale": state.get("dispatch", {}).get("rationale", "")},
        *[
            {"agent": "prosumer", "tick": tick_n,
             "action": f"{d['participant_id']}:{d['action']} {d['qty_kwh']} kWh",
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
             "action": f"trade#{a['trade_index']} {'PASS' if a['passed'] else 'FLAG:' + a['flag']}",
             "rationale": a.get("rationale", "")}
            for a in state.get("audits", [])
        ],
    ]
    return {
        "tick": tick_n,
        "forecasts": state.get("forecasts", []),
        "stress": state.get("stress", {}),
        "dispatch": state.get("dispatch", {}),
        "decisions": state.get("decisions", []),
        "trades": stored,
        "audits": state.get("audits", []),
        "decision_log": decision_log,
    }
