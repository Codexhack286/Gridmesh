"""Forecasting Agent: deterministic seasonal-naive over replay rows."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.core.schemas import Forecast


class ForecastingAgent(BaseAgent):
    name = "forecasting"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        rows = state.get("rows", [])
        tick = state.get("tick", 0)
        forecasts = [
            Forecast(
                participant_id=r["participant_id"],
                tick=tick,
                predicted_load_kw=float(r["load_kw"]),
                predicted_gen_kw=float(r["gen_kw"]),
            ).model_dump()
            for r in rows
        ]
        return {"forecasts": forecasts}
