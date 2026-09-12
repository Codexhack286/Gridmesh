"""Quant model status endpoint — derived from the live ForecastingAgent.

Reads the same source of truth the agent itself checks (its loaded model
bundle on the shared graph PIPELINE instance), so "live" is never hardcoded:
if the model file/loader is unavailable the agent falls back to
seasonal-naive and this route reports pending_training with the same shape.
No prediction output is generated, simulated, or hardcoded here.
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/quant")


def _live_model_info() -> dict:
    """Model state of the forecasting agent actually serving ticks."""
    from app.agents.graph import PIPELINE

    agent = next((a for a in PIPELINE if getattr(a, "name", "") == "forecasting"), None)
    info = getattr(agent, "model_info", None)
    if callable(info):
        return info()
    if isinstance(info, dict):
        return info
    return {"active": False, "model_path": None, "last_updated": None}


@router.get("/status")
def quant_status() -> dict:
    """Model status + current fallback. last_updated is the bundle training
    timestamp (else model file mtime), null only when no model is available."""
    info = _live_model_info()
    if info.get("active"):
        return {
            "model": "xgboost",
            "status": "live",
            "fallback": None,
            "last_updated": info.get("last_updated"),
        }
    return {
        "model": "xgboost",
        "status": "pending_training",
        "fallback": "rule_based_tiers",
        "last_updated": None,
    }
