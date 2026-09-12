"""Tick-based replay of OPSD rows on the sim clock."""
from __future__ import annotations

import pandas as pd


class Replay:
    def __init__(self, df: pd.DataFrame):
        self._ticks = sorted(df["timestamp"].unique())
        self._df = df

    @property
    def n_ticks(self) -> int:
        return len(self._ticks)

    def tick_rows(self, tick: int) -> pd.DataFrame:
        ts = self._ticks[tick % len(self._ticks)]
        return self._df[self._df["timestamp"] == ts].reset_index(drop=True)
