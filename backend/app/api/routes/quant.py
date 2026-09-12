"""Quant model status endpoint (XGBoost pricing/forecasting — not trained yet).

Honest contract only: reports pending_training while the rule-based tier
system (prosumer Tier 0–4 + fixed 0.255 clearing price + seasonal-naive
forecast) remains the live pricing logic. No prediction output is generated,
simulated, or hardcoded anywhere on this route.
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/quant")


@router.get("/status")
def quant_status() -> dict:
    """Model training status + current live fallback. last_updated is null
    until a real training run happens."""
    return {
        "model": "xgboost",
        "status": "pending_training",
        "fallback": "rule_based_tiers",
        "last_updated": None,
    }
