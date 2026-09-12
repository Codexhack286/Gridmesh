"""Download OPSD household data and build a multi-day (30 days) dataset for ML training."""
from __future__ import annotations

import sys
from pathlib import Path
import httpx
import pandas as pd

SOURCE_URL = (
    "https://data.open-power-system-data.org/household_data/2020-04-15/"
    "household_data_15min_singleindex.csv"
)
CACHE_DIR = Path(__file__).resolve().parent / ".cache"
CACHE_FILE = CACHE_DIR / "opsd_2020_15min.csv"
OUT_FILE = Path(__file__).resolve().parent / "household_multi_day.csv"

PARTICIPANTS = {
    "solar_home": ("DE_KN_residential4_grid_import", "DE_KN_residential4_pv", 8.0),
    "household": ("DE_KN_residential2_grid_import", None, 4.0),
    "commercial": ("DE_KN_industrial2_grid_import", "DE_KN_industrial2_pv", 14.0),
    "ev_station": ("DE_KN_industrial3_ev", None, 30.0),
    "battery_site": ("DE_KN_residential6_grid_import", "DE_KN_residential6_pv", 10.0),
}


def download_opsd() -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if CACHE_FILE.exists() and CACHE_FILE.stat().st_size > 10_000_000:
        print(f"Using cached raw OPSD data at: {CACHE_FILE} ({CACHE_FILE.stat().st_size / 1e6:.1f} MB)")
        return CACHE_FILE

    print(f"Downloading {SOURCE_URL} ... (approx 60 MB)")
    with httpx.stream("GET", SOURCE_URL, timeout=300.0, follow_redirects=True) as response:
        response.raise_for_status()
        downloaded = 0
        with open(CACHE_FILE, "wb") as f:
            for chunk in response.iter_bytes(chunk_size=1024 * 1024):
                f.write(chunk)
                downloaded += len(chunk)
                print(f"Downloaded {downloaded / (1024*1024):.1f} MB...", end="\r")
    print(f"\nDownload finished: {CACHE_FILE.stat().st_size / 1e6:.1f} MB")
    return CACHE_FILE


def build_multi_day_slice(days: int = 30) -> Path:
    src = download_opsd()
    cols = ["utc_timestamp"] + sorted(
        {c for load, gen, _ in PARTICIPANTS.values() for c in (load, gen) if c}
    )

    print("Reading and filtering columns from raw CSV...")
    df = pd.read_csv(src, low_memory=False, usecols=cols, parse_dates=["utc_timestamp"])
    df = df.sort_values("utc_timestamp").reset_index(drop=True)

    # Let's take June 2016 (high solar summer season with strong activity)
    # June 1, 2016 to June 30, 2016 (30 days = 2880 ticks)
    start_date = "2016-06-01"
    end_date = "2016-06-30 23:59:59"
    mask = (df["utc_timestamp"] >= start_date) & (df["utc_timestamp"] <= end_date)
    period_df = df.loc[mask].copy().reset_index(drop=True)

    print(f"Sliced period from {start_date} to {end_date}: {len(period_df)} intervals")
    if len(period_df) < 100:
        print(f"Warning: period_df has only {len(period_df)} rows. Falling back to all 2016 data.")
        period_df = df[df["utc_timestamp"].dt.year == 2016].head(96 * days).copy()

    rows = []
    for pid, (load_col, gen_col, cap) in PARTICIPANTS.items():
        load_kwh = period_df[load_col].diff().clip(lower=0).fillna(0)
        gen_kwh = (
            period_df[gen_col].diff().clip(lower=0).fillna(0)
            if gen_col else pd.Series(0.0, index=period_df.index)
        )
        batt = cap * 0.5
        for ts, lo, ge in zip(period_df["utc_timestamp"], load_kwh, gen_kwh):
            load_kw = round(float(lo) * 4, 4)
            gen_kw = round(float(ge) * 4, 4)
            batt = round(min(cap, max(0.0, batt + (gen_kw - load_kw) * 0.25)), 4)
            rows.append({
                "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S"),
                "participant_id": pid,
                "load_kw": load_kw,
                "gen_kw": gen_kw,
                "battery_kwh": batt,
            })

    out_df = pd.DataFrame(rows)
    out_df = out_df.sort_values(by=["timestamp", "participant_id"]).reset_index(drop=True)
    out_df.to_csv(OUT_FILE, index=False)
    print(f"Wrote multi-day dataset to {OUT_FILE} ({len(out_df)} rows across {len(PARTICIPANTS)} participants).")
    return OUT_FILE


if __name__ == "__main__":
    build_multi_day_slice(30)
