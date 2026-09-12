"""Regulation & Compliance Agent: 5-rule deterministic engine + LLM spot-check.

BUG-001: replaces the single qty/price check with a priority-ordered rule set:
  R-01  predatory_price_collar    — clearing_price > PRICE_CAP
  R-02  quantity_cap_breach       — qty_kwh > QTY_CAP
  R-03  self_trade_loop           — buyer_id == seller_id
  R-04  price_qty_collusion_signal — both price and qty above collusion thresholds
  R-05  feeder_overload           — aggregate tick volume > FEEDER_CAP

Rules checked in priority order (R-05 first as it's aggregate, then R-01→R-04 per trade).
Clean trades fall through to LLM spot-check with cached offline fallback.
Flagged trades are also appended to the module-level VIOLATION_LOG.
"""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.api.violation_log import VIOLATION_LOG
from app.core import config
from app.core.schemas import AuditResult, ViolationEvent
from app.llm.client import complete_json


# ── Rule definitions ──────────────────────────────────────────────────────────
# Each rule is a dict with a callable 'check' and a callable 'rationale'.
# Checked in list order; first match flags the trade and stops evaluation.

RULES: list[dict] = [
    {
        "id": "R-01",
        "flag": "predatory_price_collar",
        "severity": "critical",
        "enforcement": "void_trade",
        "check": lambda t: float(t["clearing_price"]) > config.PRICE_CAP,
        "rationale": lambda t: (
            f"Predatory pricing: clearing price {float(t['clearing_price']):.4f} $/kWh "
            f"exceeds collar ceiling {config.PRICE_CAP:.2f} $/kWh. "
            f"Trade voided — sellers may not charge above the grid reference price."
        ),
    },
    {
        "id": "R-02",
        "flag": "quantity_cap_breach",
        "severity": "critical",
        "enforcement": "void_trade",
        "check": lambda t: float(t["qty_kwh"]) > config.QTY_CAP,
        "rationale": lambda t: (
            f"Bulk trade: {float(t['qty_kwh']):.2f} kWh exceeds per-trade cap "
            f"{config.QTY_CAP:.1f} kWh. "
            f"Large single trades risk feeder instability and market cornering."
        ),
    },
    {
        "id": "R-03",
        "flag": "self_trade_loop",
        "severity": "critical",
        "enforcement": "void_trade",
        "check": lambda t: t["buyer_id"] == t["seller_id"],
        "rationale": lambda t: (
            f"Self-trade detected: buyer and seller are both '{t['buyer_id']}'. "
            f"Self-trades artificially inflate volume metrics and gaming settlement."
        ),
    },
    {
        "id": "R-04",
        "flag": "price_qty_collusion_signal",
        "severity": "warning",
        "enforcement": "alert",
        "check": lambda t: (
            float(t["clearing_price"]) > config.COLLUSION_PRICE_FLOOR
            and float(t["qty_kwh"]) > config.COLLUSION_QTY_FLOOR
        ),
        "rationale": lambda t: (
            f"Collusion signal: simultaneous high price "
            f"({float(t['clearing_price']):.4f} > {config.COLLUSION_PRICE_FLOOR} $/kWh) "
            f"and high quantity ({float(t['qty_kwh']):.2f} > {config.COLLUSION_QTY_FLOOR} kWh). "
            f"Pattern consistent with coordinated price manipulation. Alert raised."
        ),
    },
]


# ── Internal helpers ──────────────────────────────────────────────────────────

def _audit_single(
    trade: dict,
    index: int,
    tick: int,
    total_tick_kwh: float,
    injected: bool = False,
) -> dict:
    """Run all rules against one trade. Returns AuditResult as dict."""

    # R-05: Feeder overload — aggregate check (any trade in an overloaded tick is flagged)
    if total_tick_kwh > config.FEEDER_CAP:
        audit = AuditResult(
            tick=tick,
            trade_index=index,
            passed=False,
            flag="feeder_overload",
            severity="critical",
            enforcement="void_trade",
            rule_id="R-05",
            rationale=(
                f"Feeder overload: aggregate tick volume {total_tick_kwh:.2f} kWh "
                f"exceeds line cap {config.FEEDER_CAP:.1f} kWh. "
                f"This trade contributes to physical line overload and must be voided."
            ),
        )
        _log_violation(audit, trade, injected)
        return audit.model_dump()

    # R-01 → R-04: per-trade rule checks in priority order
    for rule in RULES:
        if rule["check"](trade):
            audit = AuditResult(
                tick=tick,
                trade_index=index,
                passed=False,
                flag=rule["flag"],
                severity=rule["severity"],
                enforcement=rule["enforcement"],
                rule_id=rule["id"],
                rationale=rule["rationale"](trade),
            )
            _log_violation(audit, trade, injected)
            return audit.model_dump()

    # Clean trade → LLM spot-check (with cached fallback for offline mode)
    out = complete_json(
        f"Audit P2P trade: buyer='{trade['buyer_id']}' seller='{trade['seller_id']}' "
        f"qty={float(trade['qty_kwh']):.3f} kWh price={float(trade['clearing_price']):.4f} $/kWh. "
        f"Rules: price <= {config.PRICE_CAP}, qty <= {config.QTY_CAP}, "
        f"no self-trade, no collusion (price>{config.COLLUSION_PRICE_FLOOR} AND "
        f"qty>{config.COLLUSION_QTY_FLOOR}). "
        "Reply JSON {passed, flag, severity, rationale}.",
        "regulation",
    )
    audit = AuditResult(
        tick=tick,
        trade_index=index,
        passed=bool(out.get("passed", True)),
        flag=str(out.get("flag", "")),
        severity=str(out.get("severity", "info")),
        enforcement="none",
        rule_id="llm",
        rationale=str(out.get("rationale", "Trade within all rule caps. Approved.")),
    )
    if not audit.passed:
        _log_violation(audit, trade, injected)
    return audit.model_dump()


def _log_violation(audit: AuditResult, trade: dict, injected: bool) -> None:
    """Append a ViolationEvent to the global VIOLATION_LOG."""
    ev = ViolationEvent(
        tick=audit.tick,
        trade_index=audit.trade_index,
        rule_id=audit.rule_id,
        flag=audit.flag,
        severity=audit.severity,
        enforcement=audit.enforcement,
        buyer_id=str(trade.get("buyer_id", "")),
        seller_id=str(trade.get("seller_id", "")),
        qty_kwh=float(trade.get("qty_kwh", 0.0)),
        clearing_price=float(trade.get("clearing_price", 0.0)),
        rationale=audit.rationale,
        injected=injected,
    )
    VIOLATION_LOG.append(ev)


# ── Agent ─────────────────────────────────────────────────────────────────────

class RegulationAgent(BaseAgent):
    name = "regulation"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        trades = state.get("trades", [])
        tick = state.get("tick", 0)
        injected: bool = state.get("injected", False)  # set by scenario endpoint
        total_tick_kwh = sum(float(t.get("qty_kwh", 0)) for t in trades)

        audits = [
            _audit_single(t, i, tick, total_tick_kwh, injected)
            for i, t in enumerate(trades)
        ]
        return {"audits": audits}
