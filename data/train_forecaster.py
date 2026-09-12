"""Train a robust ensemble forecaster (Random Forest + XGBoost) on 30 days of real microgrid data.

Dataset: `data/household_multi_day.csv` (14,400 rows across 5 microgrid entities).
Evaluated with strict temporal out-of-sample testing (Days 1-23 train, Days 24-30 test).
Outputs: `data/forecaster_ensemble.pkl`.
"""
from __future__ import annotations

import datetime
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

DATA_DIR = Path(__file__).resolve().parent
CSV_MULTI_DAY = DATA_DIR / "household_multi_day.csv"
CSV_FALLBACK = DATA_DIR / "household_15min.csv"
MODEL_PATH = DATA_DIR / "forecaster_ensemble.pkl"


def get_data_path() -> Path:
    if CSV_MULTI_DAY.exists():
        return CSV_MULTI_DAY
    return CSV_FALLBACK


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    """Feature engineering pipeline for real microgrid telemetry."""
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by=["participant_id", "timestamp"]).reset_index(drop=True)

    # Temporal & calendar features
    df["hour"] = df["timestamp"].dt.hour
    df["minute"] = df["timestamp"].dt.minute
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(float)
    df["tick_of_day"] = df["hour"] * 4 + df["minute"] // 15
    df["sin_time"] = np.sin(2 * np.pi * df["tick_of_day"] / 96)
    df["cos_time"] = np.cos(2 * np.pi * df["tick_of_day"] / 96)

    # Autoregressive lag features per participant
    df["lag1_load"] = df.groupby("participant_id")["load_kw"].shift(1).bfill()
    df["lag1_gen"] = df.groupby("participant_id")["gen_kw"].shift(1).bfill()

    # Participant one-hot identifiers
    participants = sorted(df["participant_id"].unique().tolist())
    for p in participants:
        df[f"p_{p}"] = (df["participant_id"] == p).astype(float)

    numeric_features = [
        "hour",
        "minute",
        "day_of_week",
        "is_weekend",
        "tick_of_day",
        "sin_time",
        "cos_time",
        "lag1_load",
        "lag1_gen",
    ]
    participant_features = [f"p_{p}" for p in participants]
    feature_cols = numeric_features + participant_features

    return df, feature_cols, participants


def build_models() -> tuple[VotingRegressor, VotingRegressor]:
    """Build regularized Random Forest + XGBoost Voting Regressors."""
    rf_load = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
    )
    xgb_load = XGBRegressor(
        n_estimators=100,
        learning_rate=0.08,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=2.0,
        random_state=42,
        n_jobs=-1,
    )
    ensemble_load = VotingRegressor([("rf", rf_load), ("xgb", xgb_load)])

    rf_gen = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
    )
    xgb_gen = XGBRegressor(
        n_estimators=100,
        learning_rate=0.08,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=2.0,
        random_state=42,
        n_jobs=-1,
    )
    ensemble_gen = VotingRegressor([("rf", rf_gen), ("xgb", xgb_gen)])

    return ensemble_load, ensemble_gen


def evaluate_temporal_split(
    df: pd.DataFrame, feature_cols: list[str]
) -> tuple[dict[str, float], dict[str, float]]:
    """Strict out-of-sample temporal split (train on earlier days, test on final 7 days)."""
    split_date = pd.to_datetime(df["timestamp"]).max() - pd.Timedelta(days=7)
    train_mask = df["timestamp"] < split_date
    test_mask = df["timestamp"] >= split_date

    if train_mask.sum() == 0 or test_mask.sum() == 0:
        # Fallback if dataset is only 1 day
        split_idx = int(len(df) * 0.75)
        train_mask = df.index < split_idx
        test_mask = df.index >= split_idx

    X_train, X_test = df.loc[train_mask, feature_cols], df.loc[test_mask, feature_cols]
    y_train_load, y_test_load = df.loc[train_mask, "load_kw"], df.loc[test_mask, "load_kw"]
    y_train_gen, y_test_gen = df.loc[train_mask, "gen_kw"], df.loc[test_mask, "gen_kw"]

    print(f"Temporal Split -> Train rows: {len(X_train)} | Unseen Test rows: {len(X_test)}")
    ens_load, ens_gen = build_models()

    # Load Demand
    ens_load.fit(X_train, y_train_load)
    pred_test_load = ens_load.predict(X_test)
    pred_train_load = ens_load.predict(X_train)
    load_metrics = {
        "train_r2": float(r2_score(y_train_load, pred_train_load)),
        "test_r2": float(r2_score(y_test_load, pred_test_load)),
        "test_mae": float(mean_absolute_error(y_test_load, pred_test_load)),
        "test_rmse": float(np.sqrt(mean_squared_error(y_test_load, pred_test_load))),
    }
    print(
        f"[Load Demand] Train R2: {load_metrics['train_r2']*100:.2f}% | "
        f"Unseen Test R2: {load_metrics['test_r2']*100:.2f}% | "
        f"Test MAE: {load_metrics['test_mae']:.4f} kW"
    )

    # Solar Generation
    ens_gen.fit(X_train, y_train_gen)
    pred_test_gen = ens_gen.predict(X_test)
    pred_train_gen = ens_gen.predict(X_train)
    gen_metrics = {
        "train_r2": float(r2_score(y_train_gen, pred_train_gen)),
        "test_r2": float(r2_score(y_test_gen, pred_test_gen)),
        "test_mae": float(mean_absolute_error(y_test_gen, pred_test_gen)),
        "test_rmse": float(np.sqrt(mean_squared_error(y_test_gen, pred_test_gen))),
    }
    print(
        f"[Solar Generation] Train R2: {gen_metrics['train_r2']*100:.2f}% | "
        f"Unseen Test R2: {gen_metrics['test_r2']*100:.2f}% | "
        f"Test MAE: {gen_metrics['test_mae']:.4f} kW"
    )

    return load_metrics, gen_metrics


def train_and_save() -> Path:
    csv_path = get_data_path()
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    processed_df, feature_cols, participants = prepare_features(df)

    print("Evaluating with strict temporal out-of-sample testing...")
    load_metrics, gen_metrics = evaluate_temporal_split(processed_df, feature_cols)

    print("Fitting production models on full multi-day dataset...")
    final_load, final_gen = build_models()
    X = processed_df[feature_cols]
    final_load.fit(X, processed_df["load_kw"])
    final_gen.fit(X, processed_df["gen_kw"])

    artifact = {
        "model_load": final_load,
        "model_gen": final_gen,
        "feature_cols": feature_cols,
        "participants": participants,
        "metrics": {
            "load": load_metrics,
            "gen": gen_metrics,
        },
        "dataset_rows": len(processed_df),
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
        """Predict (load_kw, gen_kw) for the given tick and participant."""
        if not self.is_loaded:
            return float(current_load_kw), float(current_gen_kw)

        tick_of_day = tick % 96
        hour = (tick_of_day * 15) // 60
        minute = (tick_of_day * 15) % 60
        day_of_week = (tick // 96) % 7
        is_weekend = 1.0 if day_of_week >= 5 else 0.0
        sin_time = float(np.sin(2 * np.pi * tick_of_day / 96))
        cos_time = float(np.cos(2 * np.pi * tick_of_day / 96))

        feat_dict = {
            "hour": float(hour),
            "minute": float(minute),
            "day_of_week": float(day_of_week),
            "is_weekend": float(is_weekend),
            "tick_of_day": float(tick_of_day),
            "sin_time": sin_time,
            "cos_time": cos_time,
            "lag1_load": float(current_load_kw),
            "lag1_gen": float(current_gen_kw),
        }
        for p in self.participants:
            feat_dict[f"p_{p}"] = 1.0 if p == participant_id else 0.0

        row_df = pd.DataFrame(
            [[feat_dict.get(c, 0.0) for c in self.feature_cols]],
            columns=self.feature_cols,
        )

        try:
            pred_load = max(0.0, float(self.model_load.predict(row_df)[0]))
            pred_gen = max(0.0, float(self.model_gen.predict(row_df)[0]))
            return round(pred_load, 3), round(pred_gen, 3)
        except Exception:
            return float(current_load_kw), float(current_gen_kw)


if __name__ == "__main__":
    train_and_save()
