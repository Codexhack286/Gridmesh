"""Optimization Agent: greedy battery/EV dispatch stub."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent


class OptimizationAgent(BaseAgent):
    name = "optimization"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        stressed = state.get("stressed", False)
        action = "discharge_batteries_and_defer_ev" if stressed else "charge_from_surplus"
        return {
            "dispatch": {
                "action": action,
                "rationale": (
                    "Stress active: discharge storage and defer flexible EV load."
                    if stressed
                    else "No stress: absorb midday surplus into storage."
                ),
            }
        }
