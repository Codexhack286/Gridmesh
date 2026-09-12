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
