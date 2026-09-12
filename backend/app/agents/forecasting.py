"""Forecasting Agent: Ensemble (Random Forest + XGBoost) ML forecaster with seasonal-naive fallback."""
from __future__ import annotations

import datetime
import logging
from pathlib import Path
from typing import Any
import joblib
import numpy as np
import pandas as pd

from app.agents.base import BaseAgent
from app.core.schemas import Forecast

logger = logging.getLogger(__name__)

# Search paths for the trained ensemble model
_SEARCH_PATHS = [
    Path(__file__).resolve().parents[3] / "data" / "forecaster_ensemble.pkl",
    Path("data/forecaster_ensemble.pkl"),
    Path("../data/forecaster_ensemble.pkl"),
]


class ForecastingAgent(BaseAgent):
    name = "forecasting"

    def __init__(self) -> None:
        super().__init__()
        self._model_bundle: dict[str, Any] | None = None
        self._model_path: str | None = None
        self._load_model()

    def _load_model(self) -> None:
        for p in _SEARCH_PATHS:
            if p.exists():
                try:
                    self._model_bundle = joblib.load(p)
                    self._model_path = str(p)
                    logger.info("ForecastingAgent loaded ensemble model from %s", p)
                    return
                except Exception as e:
                    logger.warning("Failed to load ensemble model from %s: %s", p, e)
        self._model_bundle = None
        self._model_path = None

    @property
    def model_info(self) -> dict[str, Any]:
        """Live model state for /api/quant/status — same source the agent checks.

        `active` is True exactly when this instance serves ensemble output
        (i.e. `_model_bundle` loaded); otherwise the agent falls back to
        seasonal-naive. `last_updated` prefers the bundle's training
        timestamp, else the model file mtime.
        """
        if self._model_bundle is None:
            return {"active": False, "model_path": None, "last_updated": None}
        last_updated: str | None = self._model_bundle.get("created_at")
        if last_updated is None and self._model_path:
            try:
                last_updated = datetime.datetime.fromtimestamp(
                    Path(self._model_path).stat().st_mtime, tz=datetime.timezone.utc
                ).isoformat()
            except OSError:
                last_updated = None
        return {
            "active": True,
            "model_path": self._model_path,
            "last_updated": last_updated,
        }

    def _predict_one(
        self,
        tick: int,
        participant_id: str,
        current_load: float,
        current_gen: float,
    ) -> tuple[float, float, str]:
        if not self._model_bundle:
            return current_load, current_gen, "seasonal-naive replay forecast"

        try:
            model_load = self._model_bundle["model_load"]
            model_gen = self._model_bundle["model_gen"]
            feature_cols = self._model_bundle["feature_cols"]
            participants = self._model_bundle.get("participants", [])

            tick_of_day = tick % 96
            hour = (tick_of_day * 15) // 60
            minute = (tick_of_day * 15) % 60
            sin_time = float(np.sin(2 * np.pi * tick_of_day / 96))
            cos_time = float(np.cos(2 * np.pi * tick_of_day / 96))

            feat_dict: dict[str, float] = {
                "hour": float(hour),
                "minute": float(minute),
                "tick_of_day": float(tick_of_day),
                "sin_time": sin_time,
                "cos_time": cos_time,
                "lag1_load": float(current_load),
                "lag1_gen": float(current_gen),
            }
            for p in participants:
                feat_dict[f"p_{p}"] = 1.0 if p == participant_id else 0.0

            row_df = pd.DataFrame(
                [[feat_dict.get(c, 0.0) for c in feature_cols]],
                columns=feature_cols,
            )

            pred_load = max(0.0, float(model_load.predict(row_df)[0]))
            pred_gen = max(0.0, float(model_gen.predict(row_df)[0]))
            return (
                round(pred_load, 3),
                round(pred_gen, 3),
                "Ensemble ML (RF+XGBoost) forward forecast",
            )
        except Exception:
            return current_load, current_gen, "seasonal-naive fallback"

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        rows = state.get("rows", [])
        tick = state.get("tick", 0)

        forecasts = []
        is_ml = bool(self._model_bundle is not None)

        for r in rows:
            p_id = r["participant_id"]
            curr_load = float(r.get("load_kw", 0.0))
            curr_gen = float(r.get("gen_kw", 0.0))

            pred_load, pred_gen, rationale = self._predict_one(
                tick, p_id, curr_load, curr_gen
            )

            forecasts.append(
                Forecast(
                    participant_id=p_id,
                    tick=tick,
                    predicted_load_kw=pred_load,
                    predicted_gen_kw=pred_gen,
                    rationale=rationale,
                ).model_dump()
            )

        return {
            "forecasts": forecasts,
            "forecast_model": "Ensemble(RandomForest + XGBoost)" if is_ml else "Seasonal-Naive",
            "forecast_rationale": (
                "Ensemble ML (Random Forest + XGBoost) 15-min forward forecast."
                if is_ml
                else "Seasonal-naive replay forecast per participant."
            ),
        }
