"""Train an ensemble forecaster (Random Forest + XGBoost) on microgrid historical data.

Outputs a bundled model artifact: `data/forecaster_ensemble.pkl`.
"""
from __future__ import annotations

import datetime
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from xgboost import XGBRegressor

DATA_DIR = Path(__file__).resolve().parent
CSV_PATH = DATA_DIR / "household_15min.csv"
MODEL_PATH = DATA_DIR / "forecaster_ensemble.pkl"


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    """Feature engineering pipeline for microgrid time-series."""
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by=["participant_id", "timestamp"]).reset_index(drop=True)

    # Time features
    df["hour"] = df["timestamp"].dt.hour
    df["minute"] = df["timestamp"].dt.minute
    df["tick_of_day"] = df["hour"] * 4 + df["minute"] // 15
    df["sin_time"] = np.sin(2 * np.pi * df["tick_of_day"] / 96)
    df["cos_time"] = np.cos(2 * np.pi * df["tick_of_day"] / 96)

    # Lag features per participant (represents autoregressive load/gen)
    df["lag1_load"] = df.groupby("participant_id")["load_kw"].shift(1).bfill()
    df["lag1_gen"] = df.groupby("participant_id")["gen_kw"].shift(1).bfill()

    # Participant identifiers
    participants = sorted(df["participant_id"].unique().tolist())
    for p in participants:
        df[f"p_{p}"] = (df["participant_id"] == p).astype(float)

    numeric_features = ["hour", "minute", "tick_of_day", "sin_time", "cos_time", "lag1_load", "lag1_gen"]
    participant_features = [f"p_{p}" for p in participants]
    feature_cols = numeric_features + participant_features

    return df, feature_cols, participants


def build_ensemble() -> VotingRegressor:
    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    xgb = XGBRegressor(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=42, n_jobs=-1)
    return VotingRegressor(estimators=[("rf", rf), ("xgb", xgb)])


def evaluate_cv(X: pd.DataFrame, y: pd.Series, target_name: str) -> dict[str, float]:
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    maes, rmses, r2s = [], [], []

    for train_idx, test_idx in kf.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        model = build_ensemble()
        model.fit(X_train, y_train)
        pred = model.predict(X_test)

        maes.append(mean_absolute_error(y_test, pred))
        rmses.append(float(np.sqrt(mean_squared_error(y_test, pred))))
        r2s.append(r2_score(y_test, pred))

    metrics = {
        "mae": float(np.mean(maes)),
        "rmse": float(np.mean(rmses)),
        "r2": float(np.mean(r2s)),
    }
    print(f"[{target_name}] 5-Fold CV -> MAE: {metrics['mae']:.4f} kW | RMSE: {metrics['rmse']:.4f} kW | R2: {metrics['r2']*100:.2f}%")
    return metrics


def train_and_save() -> Path:
    print(f"Loading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    processed_df, feature_cols, participants = prepare_features(df)

    X = processed_df[feature_cols]
    y_load = processed_df["load_kw"]
    y_gen = processed_df["gen_kw"]

    print("Evaluating Ensemble (Random Forest + XGBoost)...")
    load_metrics = evaluate_cv(X, y_load, "load_kw (Demand)")
    gen_metrics = evaluate_cv(X, y_gen, "gen_kw (Solar Generation)")

    print("Fitting final production models on full dataset...")
    model_load = build_ensemble()
    model_load.fit(X, y_load)

    model_gen = build_ensemble()
    model_gen.fit(X, y_gen)

    artifact = {
        "model_load": model_load,
        "model_gen": model_gen,
        "feature_cols": feature_cols,
        "participants": participants,
        "metrics": {
            "load": load_metrics,
            "gen": gen_metrics,
        },
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    joblib.dump(artifact, MODEL_PATH)
    print(f"Saved trained ensemble model to: {MODEL_PATH}")
    return MODEL_PATH


class EnsembleForecaster:
    """Helper wrapper for low-latency inference inside the simulation loop."""

    def __init__(self, model_path: Path | str = MODEL_PATH):
        self.model_path = Path(model_path)
        self.is_loaded = False
        self.model_load = None
        self.model_gen = None
        self.feature_cols: list[str] = []
        self.participants: list[str] = []
        self.metrics: dict = {}
        self.load_model()

    def load_model(self) -> bool:
        if not self.model_path.exists():
            return False
        try:
            data = joblib.load(self.model_path)
            self.model_load = data["model_load"]
            self.model_gen = data["model_gen"]
            self.feature_cols = data["feature_cols"]
            self.participants = data["participants"]
            self.metrics = data.get("metrics", {})
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"Warning: Failed to load forecaster model: {e}")
            self.is_loaded = False
            return False

    def predict(
        self,
        tick: int,
        participant_id: str,
        current_load_kw: float,
        current_gen_kw: float,
    ) -> tuple[float, float]:
        """Predict (load_kw, gen_kw) for the given tick and participant.

        If model is unavailable or participant is unknown, falls back cleanly to current values.
        """
        if not self.is_loaded:
            return float(current_load_kw), float(current_gen_kw)

        tick_of_day = tick % 96
        hour = (tick_of_day * 15) // 60
        minute = (tick_of_day * 15) % 60
        sin_time = float(np.sin(2 * np.pi * tick_of_day / 96))
        cos_time = float(np.cos(2 * np.pi * tick_of_day / 96))

        # Build feature dict matching training schema
        feat_dict = {
            "hour": hour,
            "minute": minute,
            "tick_of_day": tick_of_day,
            "sin_time": sin_time,
            "cos_time": cos_time,
            "lag1_load": float(current_load_kw),
            "lag1_gen": float(current_gen_kw),
        }
        for p in self.participants:
            feat_dict[f"p_{p}"] = 1.0 if p == participant_id else 0.0

        # Construct input DataFrame with exact column ordering
        row_df = pd.DataFrame([[feat_dict.get(c, 0.0) for c in self.feature_cols]], columns=self.feature_cols)

        try:
            pred_load = max(0.0, float(self.model_load.predict(row_df)[0]))
            pred_gen = max(0.0, float(self.model_gen.predict(row_df)[0]))
            return round(pred_load, 3), round(pred_gen, 3)
        except Exception:
            return float(current_load_kw), float(current_gen_kw)


if __name__ == "__main__":
    train_and_save()
