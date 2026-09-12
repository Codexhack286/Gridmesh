"""Regulation & Compliance Agent: rule audit + LLM reasoning over flags."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.core.schemas import AuditResult
from app.llm.client import complete_json

MAX_QTY_KWH = 5.0


class RegulationAgent(BaseAgent):
    name = "regulation"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        trades = state.get("trades", [])
        tick = state.get("tick", 0)
        audits = []
        for i, t in enumerate(trades):
            if t["qty_kwh"] > MAX_QTY_KWH or t["clearing_price"] <= 0:
                audits.append(
                    AuditResult(
                        tick=tick,
                        trade_index=i,
                        passed=False,
                        flag="quantity_or_price_violation",
                        rationale="Trade exceeds per-tick cap or has non-positive price.",
                    ).model_dump()
                )
                continue
            out = complete_json(
                f"Audit trade {t} against fair-pricing rules. "
                "Reply JSON {passed, flag, rationale}.",
                "regulation",
            )
            audits.append(
                AuditResult(
                    tick=tick,
                    trade_index=i,
                    passed=bool(out.get("passed", True)),
                    flag=str(out.get("flag", "")),
                    rationale=str(out.get("rationale", "Rule fallback: within caps.")),
                ).model_dump()
            )
        return {"audits": audits}
