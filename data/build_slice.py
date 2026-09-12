"""Build the GridMesh demo slice from real OPSD household data.

Source: Open Power System Data, household_data 2020-04-15, 15-min singleindex
(https://data.open-power-system-data.org/household_data/2020-04-15/).
Raw columns are cumulative kWh meter counters; this script diffs them into
avg-kW interval readings for one high-solar demo day and simulates batteries.

Provenance: re-run `uv run python data/build_slice.py` to regenerate
`data/household_15min.csv` from source (downloads ~60MB on first run).
"""
from __future__ import annotations

import sys
from pathlib import Path

SOURCE_URL = (
    "https://data.open-power-system-data.org/household_data/2020-04-15/"
    "household_data_15min_singleindex.csv"
)
DAY = "2016-06-10"  # highest-PV June day with EV charging + evening peak
CACHE = Path(__file__).parent / ".cache" / "opsd_2020_15min.csv"
OUT = Path(__file__).parent / "household_15min.csv"

# participant -> (load_counter, gen_counter, battery_cap_kwh)
PARTICIPANTS = {
    "solar_home": ("DE_KN_residential4_grid_import", "DE_KN_residential4_pv", 8.0),
    "household": ("DE_KN_residential2_grid_import", None, 4.0),
    "commercial": ("DE_KN_industrial2_grid_import", "DE_KN_industrial2_pv", 14.0),
    "ev_station": ("DE_KN_industrial3_ev", None, 30.0),
    "battery_site": ("DE_KN_residential6_grid_import", "DE_KN_residential6_pv", 10.0),
}


def fetch() -> Path:
    if OUT.exists() and not CACHE.exists():
        return OUT
    if not CACHE.exists():
        import httpx

        CACHE.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {SOURCE_URL} ...")
        with httpx.stream("GET", SOURCE_URL, timeout=120, follow_redirects=True) as r:
            r.raise_for_status()
            with open(CACHE, "wb") as f:
                for chunk in r.iter_bytes(1 << 20):
                    f.write(chunk)
    return CACHE


def main() -> None:
    import pandas as pd

    src = fetch()
    if src == OUT:
        print("slice already built:", OUT)
        return
    cols = ["utc_timestamp"] + sorted(
        {c for load, gen, _ in PARTICIPANTS.values() for c in (load, gen) if c}
    )
    df = pd.read_csv(src, low_memory=False, usecols=cols,
                     parse_dates=["utc_timestamp"]).sort_values("utc_timestamp")
    day = df[df["utc_timestamp"].dt.date.astype(str) == DAY].copy()
    assert len(day) == 96, f"expected 96 ticks, got {len(day)}"
    rows = []
    for pid, (load_col, gen_col, cap) in PARTICIPANTS.items():
        load_kwh = day[load_col].diff().clip(lower=0).fillna(0)
        gen_kwh = (
            day[gen_col].diff().clip(lower=0).fillna(0)
            if gen_col else pd.Series(0.0, index=day.index)
        )
        batt = cap * 0.5
        for ts, lo, ge in zip(day["utc_timestamp"], load_kwh, gen_kwh):
            load_kw, gen_kw = round(float(lo) * 4, 4), round(float(ge) * 4, 4)
            batt = round(min(cap, max(0.0, batt + (gen_kw - load_kw) * 0.25)), 4)
            rows.append({
                "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S"),
                "participant_id": pid,
                "load_kw": load_kw,
                "gen_kw": gen_kw,
                "battery_kwh": batt,
            })
    pd.DataFrame(rows).to_csv(OUT, index=False)
    print(f"wrote {OUT} ({len(rows)} rows, {DAY}, {len(PARTICIPANTS)} participants)")


if __name__ == "__main__":
    sys.exit(main())
