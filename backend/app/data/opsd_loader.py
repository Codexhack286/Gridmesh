"""OPSD household data loader.

Prefers the real-data day slice (data/household_15min.csv, built by
data/build_slice.py from OPSD household_data 2020-04-15); falls back to the
tiny hand-written sample when absent (e.g. fresh checkout without the slice).
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[3] / "data"
FULL_PATH = DATA_DIR / "household_15min.csv"
SAMPLE_PATH = DATA_DIR / "sample_opsd.csv"


def load_sample(path: Path = SAMPLE_PATH) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["timestamp"])
    return df.sort_values(["timestamp", "participant_id"]).reset_index(drop=True)


def load_default() -> pd.DataFrame:
    if FULL_PATH.exists():
        return load_sample(FULL_PATH)
    return load_sample(SAMPLE_PATH)


def capacity_map(df: pd.DataFrame | None = None) -> dict[str, float]:
    """Return {participant_id: max_battery_kwh} from df or the default loaded slice.

    Used by ProsumerAgent to compute battery SOC % per tick without re-reading the file.
    Falls back to config.BATTERY_CAPACITIES if battery_kwh column is absent.
    """
    src = df if df is not None else load_default()
    if "battery_kwh" not in src.columns:
        from app.core import config  # late import to avoid circular
        return config.BATTERY_CAPACITIES
    return src.groupby("participant_id")["battery_kwh"].max().to_dict()

