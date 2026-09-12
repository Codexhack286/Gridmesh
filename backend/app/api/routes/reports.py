"""Reporting API endpoint for cumulative sustainability and financial metrics.

Computes total P2P volume from the SQLite ledger and derives CO2 avoided
and financial savings using constants from config.
"""
from __future__ import annotations

import datetime

from fastapi import APIRouter

from app.api.violation_log import VIOLATION_LOG
from app.core import config
from app.ledger.table import LEDGER

router = APIRouter(prefix="/api/reports")


@router.get("")
def get_reports() -> dict:
    """Returns cumulative community metrics for the Reports & Insights panel."""
    # O(1) fetch from SQLite aggregate query
    stats = LEDGER.stats()
    total_kwh = stats.get("total_kwh", 0.0)
    total_trades = stats.get("total_trades", 0)
    
    # Sustainability and financial derived metrics
    co2_avoided_kg = total_kwh * config.CO2_KG_PER_KWH
    financial_savings_usd = total_kwh * (config.GRID_PRICE_KWH - config.P2P_PRICE_KWH)
    
    # Calculate average savings percentage
    if config.GRID_PRICE_KWH > 0:
        avg_savings_pct = ((config.GRID_PRICE_KWH - config.P2P_PRICE_KWH) / config.GRID_PRICE_KWH) * 100
    else:
        avg_savings_pct = 0.0

    # Compliance summary
    all_violations = VIOLATION_LOG.list()
    injected_count = sum(1 for v in all_violations if v.get("injected"))

    return {
        "generated_at": datetime.datetime.now(datetime.UTC).isoformat() + "Z",
        "period": {
            "first_tick": stats.get("first_tick", 0),
            "last_tick": stats.get("last_tick", 0),
        },
        "community": {
            "total_p2p_trades": total_trades,
            "total_kwh_traded": total_kwh,
            "total_value_usd": stats.get("total_value_usd", 0.0),
            "financial_savings_usd": financial_savings_usd,
            "co2_avoided_kg": co2_avoided_kg,
            "grid_price_reference_usd": config.GRID_PRICE_KWH,
            "p2p_avg_price_usd": config.P2P_PRICE_KWH,
            "avg_savings_pct": avg_savings_pct,
            "currency": "USD",
        },
        "compliance": {
            "violations_total": len(all_violations),
            "violations_injected": injected_count,
        }
    }
