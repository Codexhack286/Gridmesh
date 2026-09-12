"""Grid Health Agent: rule-based stress detection, LLM escalation hook."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.core import config
from app.core.schemas import StressEvent

THRESHOLD_KW = config.STRESS_THRESHOLD_KW


class GridHealthAgent(BaseAgent):
    name = "grid_health"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        rows = state.get("rows", [])
        tick = state.get("tick", 0)
        demand = sum(float(r["load_kw"]) for r in rows)
        stressed = demand >= THRESHOLD_KW
        event = StressEvent(
            tick=tick,
            aggregate_demand_kw=round(demand, 3),
            threshold_kw=THRESHOLD_KW,
            rationale=(
                f"Aggregate demand {demand:.2f} kW "
                + ("meets/exceeds" if stressed else "below")
                + f" threshold {THRESHOLD_KW:.2f} kW."
            ),
        )
        return {"stress": event.model_dump(), "stressed": stressed}
