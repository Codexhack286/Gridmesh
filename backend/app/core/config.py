"""Runtime config from environment."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _get(key: str, default: str) -> str:
    return os.getenv(key, default)


LLM_PROVIDER = _get("LLM_PROVIDER", "groq")
GROQ_API_KEY = _get("GROQ_API_KEY", "")
GROQ_MODEL = _get("GROQ_MODEL", "llama-3.3-70b-versatile")
NIM_API_KEY = _get("NIM_API_KEY", "")
NIM_MODEL = _get("NIM_MODEL", "meta/llama-3.1-70b-instruct")
TICK_SECONDS = int(_get("GRIDMESH_TICK_SECONDS", "900"))
PARTICIPANTS = int(_get("GRIDMESH_PARTICIPANTS", "5"))
DATABASE_URL = _get("DATABASE_URL", "sqlite:///./gridmesh.db")
# Derive filesystem path from DATABASE_URL for stdlib sqlite3
_raw = DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
DB_PATH = Path(_raw) if _raw.startswith("/") else Path(__file__).resolve().parents[3] / _raw

# ── Sustainability reporting constants ────────────────────────────────────────
CO2_KG_PER_KWH  = float(_get("GRIDMESH_CO2_KG_PER_KWH",  "0.233"))  # kg CO₂ per kWh (EU avg)
GRID_PRICE_KWH  = float(_get("GRIDMESH_GRID_PRICE",       "0.30"))   # retail $/kWh reference
P2P_PRICE_KWH   = float(_get("GRIDMESH_P2P_PRICE",        "0.255"))  # avg P2P clearing price

# Calibrated so the 2016-06-10 demo slice trips stress on its evening peak
# (17/96 ticks) while midday surplus stays a trading window.
STRESS_THRESHOLD_KW = float(_get("GRIDMESH_STRESS_KW", "6.0"))

# ── Regulation rule thresholds ────────────────────────────────────────────────
# All overridable via environment variables for different grid operator configs.
PRICE_CAP = float(_get("GRIDMESH_PRICE_CAP", "0.30"))          # R-01: $/kWh ceiling
QTY_CAP   = float(_get("GRIDMESH_QTY_CAP",   "10.0"))          # R-02: kWh per-trade cap
FEEDER_CAP = float(_get("GRIDMESH_FEEDER_CAP", "8.0"))         # R-05: kWh aggregate per tick
COLLUSION_PRICE_FLOOR = float(_get("GRIDMESH_COLLUSION_PRICE", "0.28"))  # R-04: price signal
COLLUSION_QTY_FLOOR   = float(_get("GRIDMESH_COLLUSION_QTY",   "3.0"))   # R-04: qty signal

# Battery capacities in kWh — derived from max(battery_kwh) per participant
# in OPSD slice 2016-06-10. Update via env GRIDMESH_BAT_<PARTICIPANT>=N if slice changes.
BATTERY_CAPACITIES: dict[str, float] = {
    "solar_home":   float(_get("GRIDMESH_BAT_SOLAR_HOME",   "8.0")),
    "household":    float(_get("GRIDMESH_BAT_HOUSEHOLD",     "2.0")),
    "commercial":   float(_get("GRIDMESH_BAT_COMMERCIAL",   "14.0")),
    "ev_station":   float(_get("GRIDMESH_BAT_EV_STATION",   "15.0")),
    "battery_site": float(_get("GRIDMESH_BAT_BATTERY_SITE", "10.0")),
}

# Default free-text preferences per participant.
# Overridable at runtime via POST /preferences/{participant_id}.
DEFAULT_PREFERENCES: dict[str, str] = {
    "solar_home":   "Keep 30% battery reserve. Sell surplus when battery above 80%.",
    "household":    "Buy from P2P if available. Use grid as fallback.",
    "commercial":   "Aggressive arbitrage. Sell all surplus above 20% reserve.",
    "ev_station":   "Charge to 90% by departure. Accept throttling during grid stress.",
    "battery_site": "Community buffer. Keep 40% reserve for evening discharge.",
}

