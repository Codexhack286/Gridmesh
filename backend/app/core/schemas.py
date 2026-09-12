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
