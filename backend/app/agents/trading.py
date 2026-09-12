"""Trading & Negotiation Agent: deterministic clearing + LLM edge-case hook."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.core.schemas import Trade

GRID_PRICE = 0.30  # benchmark price per kWh


class TradingAgent(BaseAgent):
    name = "trading"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        decisions = state.get("decisions", [])
        tick = state.get("tick", 0)
        sellers = [d for d in decisions if d["action"] == "sell" and d["qty_kwh"] > 0]
        buyers = [d for d in decisions if d["action"] == "buy" and d["qty_kwh"] > 0]
        trades: list[dict] = []
        for seller, buyer in zip(sellers, buyers):
            qty = round(min(seller["qty_kwh"], buyer["qty_kwh"]), 3)
            if qty <= 0:
                continue
            price = round(GRID_PRICE * 0.85, 4)  # P2P discount to grid
            trades.append(
                Trade(
                    tick=tick,
                    buyer_id=buyer["participant_id"],
                    seller_id=seller["participant_id"],
                    qty_kwh=qty,
                    clearing_price=price,
                    rationale=(
                        f"Cleared {qty} kWh at {price}/kWh "
                        f"(15% below grid {GRID_PRICE}/kWh benchmark)."
                    ),
                ).model_dump()
            )
        return {"trades": trades}
