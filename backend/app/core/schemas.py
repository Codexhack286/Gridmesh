"""Shared agent/ledger schemas. Every autonomous decision carries a rationale."""
from __future__ import annotations

from pydantic import BaseModel, Field


class DecisionLog(BaseModel):
    agent: str
    tick: int
    action: str
    rationale: str = Field(min_length=1)


class Forecast(BaseModel):
    participant_id: str
    tick: int
    predicted_load_kw: float
    predicted_gen_kw: float
    rationale: str = "seasonal-naive replay forecast"


class StressEvent(BaseModel):
    tick: int
    aggregate_demand_kw: float
    threshold_kw: float
    islanded: bool = False
    rationale: str = ""


class ProsumerDecision(BaseModel):
    participant_id: str
    tick: int
    action: str  # buy | sell | store | consume
    qty_kwh: float = 0.0
    rationale: str = ""
    battery_soc_pct: float = 0.0      # 0–100 %, shown in decision log
    battery_action: str = "none"       # charge | discharge | hold | none
    preference_applied: str = ""       # echoes which preference shaped the decision


class ParticipantPrefs(BaseModel):
    """Parsed representation of a free-text user preference string."""
    reserve_pct: float = 30.0          # minimum SOC % to keep as reserve
    sell_threshold_pct: float = 80.0   # only sell once SOC >= this
    strategy: str = "balanced"         # balanced | aggressive | conservative


class DispatchCommand(BaseModel):
    """A single per-participant command issued by the OptimizationAgent this tick."""
    participant_id: str
    command: str           # charge | discharge | throttle_ev | hold
    qty_kwh: float         # target energy to move this 15-min tick
    rate_kw: float         # implied power = qty_kwh / 0.25
    rationale: str = ""


class DispatchResult(BaseModel):
    """Full structured output of OptimizationAgent, replacing the old {action, rationale} dict."""
    tick: int
    mode: str              # surplus_absorption | peak_shaving | idle
    commands: list[DispatchCommand] = []
    net_absorbed_kwh: float = 0.0    # kWh pushed INTO batteries this tick
    net_discharged_kwh: float = 0.0  # kWh pulled FROM batteries this tick
    ev_throttle_kw: float = 0.0      # aggregate EV load reduction applied
    net_wasted_kwh: float = 0.0      # surplus that couldn't be absorbed (all batteries full)
    rationale: str = ""


class Trade(BaseModel):
    tick: int
    buyer_id: str
    seller_id: str
    qty_kwh: float
    clearing_price: float
    rationale: str = ""


class AuditResult(BaseModel):
    tick: int
    trade_index: int
    passed: bool
    flag: str = ""
    rationale: str = ""
    severity: str = "info"         # info | warning | critical
    enforcement: str = "none"      # none | alert | void_trade | suspend
    rule_id: str = ""              # R-01…R-05 or "llm"


class ViolationEvent(BaseModel):
    """Appended to ViolationLog for every flagged audit. Captures full trade context."""
    tick: int
    trade_index: int
    rule_id: str
    flag: str
    severity: str
    enforcement: str
    buyer_id: str
    seller_id: str
    qty_kwh: float
    clearing_price: float
    rationale: str
    injected: bool = False          # True when raised via /api/scenario/rogue_bid
