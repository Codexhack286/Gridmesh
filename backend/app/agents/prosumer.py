"""Prosumer Agent: LLM-driven buy/sell/store/consume per participant."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.core.schemas import ProsumerDecision
from app.llm.client import complete_json


class ProsumerAgent(BaseAgent):
    name = "prosumer"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        rows = state.get("rows", [])
        tick = state.get("tick", 0)
        decisions = []
        for r in rows:
            surplus = float(r["gen_kw"]) - float(r["load_kw"])
            if surplus > 0.1:
                out = complete_json(
                    f"Participant {r['participant_id']} surplus {surplus:.2f} kW. "
                    "Decide sell/store/consume as JSON {action, qty_kwh, rationale}.",
                    "prosumer",
                )
                action = out.get("action", "sell")
            elif surplus < -0.1:
                action, out = "buy", {"qty_kwh": round(abs(surplus) * 0.25, 3)}
            else:
                action, out = "consume", {"qty_kwh": 0.0}
            decisions.append(
                ProsumerDecision(
                    participant_id=r["participant_id"],
                    tick=tick,
                    action=action,
                    qty_kwh=float(out.get("qty_kwh", 0.0)),
                    rationale=str(out.get("rationale", f"Rule fallback: net {surplus:+.2f} kW.")),
                ).model_dump()
            )
        return {"decisions": decisions}
