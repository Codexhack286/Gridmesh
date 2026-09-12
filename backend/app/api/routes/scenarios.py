"""Scenario injection endpoint — POST /api/scenario/rogue_bid.

Injects a preset illegal bid through the RegulationAgent pipeline so violations
can be demonstrated live. Five preset scenarios each trigger a different rule:
  predatory_price  → R-01 (price collar)
  bulk_dump        → R-02 (quantity cap)
  self_trade       → R-03 (self-trade loop)
  collusion        → R-04 (price-qty collusion signal)
  feeder_overload  → R-05 (aggregate feeder cap)
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.regulation import RegulationAgent
from app.api.violation_log import VIOLATION_LOG
from app.core import config

router = APIRouter(prefix="/api/scenario")


# ── Preset scenarios ──────────────────────────────────────────────────────────

_SINGLE = "single"
_MULTI  = "multi"

SCENARIOS: dict[str, dict] = {
    "predatory_price": {
        "kind": _SINGLE,
        "description": "Seller charges 0.45 $/kWh — 50% above the 0.30 $/kWh collar.",
        "trade": {
            "buyer_id": "household",
            "seller_id": "solar_home",
            "qty_kwh": 0.5,
            "clearing_price": 0.45,
            "rationale": "Rogue bid: predatory price scenario",
        },
    },
    "bulk_dump": {
        "kind": _SINGLE,
        "description": "Seller dumps 12 kWh in a single trade — above the 10 kWh per-trade cap.",
        "trade": {
            "buyer_id": "ev_station",
            "seller_id": "commercial",
            "qty_kwh": 12.0,
            "clearing_price": 0.255,
            "rationale": "Rogue bid: bulk dump scenario",
        },
    },
    "self_trade": {
        "kind": _SINGLE,
        "description": "solar_home buys from itself — classic wash-trade to inflate volume.",
        "trade": {
            "buyer_id": "solar_home",
            "seller_id": "solar_home",
            "qty_kwh": 1.0,
            "clearing_price": 0.255,
            "rationale": "Rogue bid: self-trade loop scenario",
        },
    },
    "collusion": {
        "kind": _SINGLE,
        "description": "High price + high quantity simultaneous — coordinated price manipulation signal.",
        "trade": {
            "buyer_id": "battery_site",
            "seller_id": "commercial",
            "qty_kwh": 3.5,
            "clearing_price": 0.29,
            "rationale": "Rogue bid: collusion signal scenario",
        },
    },
    "feeder_overload": {
        "kind": _MULTI,
        "description": "5 simultaneous trades totalling 11 kWh — exceeds the 8 kWh feeder cap.",
        "trades": [
            {"buyer_id": "ev_station",   "seller_id": "solar_home",   "qty_kwh": 2.5, "clearing_price": 0.255, "rationale": "feeder batch"},
            {"buyer_id": "household",    "seller_id": "commercial",   "qty_kwh": 2.5, "clearing_price": 0.255, "rationale": "feeder batch"},
            {"buyer_id": "battery_site", "seller_id": "solar_home",   "qty_kwh": 2.0, "clearing_price": 0.255, "rationale": "feeder batch"},
            {"buyer_id": "ev_station",   "seller_id": "battery_site", "qty_kwh": 2.0, "clearing_price": 0.255, "rationale": "feeder batch"},
            {"buyer_id": "household",    "seller_id": "solar_home",   "qty_kwh": 2.0, "clearing_price": 0.255, "rationale": "feeder batch"},
        ],
    },
}


# ── Request/Response models ───────────────────────────────────────────────────

class RogueBidRequest(BaseModel):
    kind: str     # must be one of SCENARIOS keys
    tick: int = 9999


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/rogue_bid/kinds")
def list_scenarios() -> dict:
    """List all available rogue bid scenario kinds."""
    return {
        "scenarios": {
            k: {"description": v["description"], "kind": v["kind"]}
            for k, v in SCENARIOS.items()
        }
    }


@router.post("/rogue_bid")
def inject_rogue_bid(req: RogueBidRequest) -> dict:
    """Inject a preset illegal bid and run it through the full RegulationAgent pipeline.

    The injected trade(s) bypass the trading agent — they go directly into regulation
    so the compliance response can be observed in isolation.
    """
    scenario = SCENARIOS.get(req.kind)
    if scenario is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{req.kind}'. Valid kinds: {list(SCENARIOS)}",
        )

    # Build trade list
    if scenario["kind"] == _MULTI:
        trades = [{"tick": req.tick, **t} for t in scenario["trades"]]
    else:
        trades = [{"tick": req.tick, **scenario["trade"]}]

    # Run through RegulationAgent (with injected=True so ViolationLog marks them)
    state = {"trades": trades, "tick": req.tick, "injected": True}
    result = RegulationAgent().run(state)
    audits = result["audits"]

    # Summarise
    flagged = [a for a in audits if not a["passed"]]
    flags_by_rule = {}
    for a in flagged:
        rule = a.get("rule_id", "?")
        flags_by_rule[rule] = flags_by_rule.get(rule, 0) + 1

    return {
        "scenario": req.kind,
        "description": scenario["description"],
        "tick": req.tick,
        "trades_injected": len(trades),
        "audits": audits,
        "violations_raised": len(flagged),
        "flags_by_rule": flags_by_rule,
        "violation_log_total": VIOLATION_LOG.count(),
        "thresholds": {
            "price_cap_per_kwh": config.PRICE_CAP,
            "qty_cap_kwh": config.QTY_CAP,
            "feeder_cap_kwh": config.FEEDER_CAP,
            "collusion_price_floor": config.COLLUSION_PRICE_FLOOR,
            "collusion_qty_floor": config.COLLUSION_QTY_FLOOR,
        },
    }


@router.get("/violations")
def get_violations(injected_only: bool = False) -> dict:
    """Return the accumulated violation log.

    Pass ?injected_only=true to see only scenario-injected violations (demo mode).
    """
    events = VIOLATION_LOG.list(injected_only=injected_only)
    return {
        "total": len(events),
        "injected_only": injected_only,
        "violations": events,
    }


@router.delete("/violations")
def clear_violations() -> dict:
    """Clear the violation log (useful for resetting demo state)."""
    n = VIOLATION_LOG.clear()
    return {"cleared": n}
