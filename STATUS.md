# GridMesh — Project Status

> Living document. Update on every phase transition or verification run.
> Last updated: 2026-09-12 · Phase 2 signed off · ML Forecaster Live · `uv run pytest`: **55 passed (with live Groq key)** · Live-LLM backend workout green, BUG-002 fixed · Frontend rebuilt as single-screen Control Center (simulation.html port, Tasks 1–10), gates green, BUG-003 fixed

Spec: `gridmesh_prd.md` (restored 2026-09-12 — see BUGLOG DOC-001) · Issues: `docs/BUGLOG.md` · Quickstart: `README.md` · ML: `data/train_forecaster.py`

## Phase tracker (PRD §8)

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation (hrs 0–9) | Data replay, Forecasting, deterministic clearing, Grid Health stress, dashboard shell | ✅ **Complete** |
| 2 — Agentic Core (hrs 9–17) | LLM prosumer prefs, Optimization dispatch, Regulation edge cases, negotiation, full decision log | ✅ **Complete** (signed off 2026-09-12) |
| 3 — Freeze & Harden (hrs 18–20) | Bug fixes only, stats/reports panel | ⬜ In Progress |
| 4 — Blockchain Layer (hrs 20–22) | Hash-chained ledger, pseudonymous IDs, contract sim, carbon credits — only if Phases 1–3 stable | ⬜ Scoped (interface exists: `backend/app/ledger/interface.py`) |
| 5 — Pitch & Rehearsal (hrs 22–24) | Demo script, rehearsal, backup video | ⬜ Not started |

## Phase 2 sign-off evidence

- `uv run pytest -q` → **55 passed** (verified 2026-09-12 post-merge; covers prosumer battery logic, optimization dispatch, 5 regulation rules, and SQLite ledger).
- **Prosumer Preferences (LOOP-001)**: Battery SOC natively computed and respected before trading.
- **Optimization (LOOP-002)**: Peak-shaving active. Community batteries discharge and EVs throttle during evening stress.
- **Regulation (BUG-001)**: 5-rule compliance engine fully tests price collars, qty caps, self-trades, collusion, and feeder limits via `POST /api/scenario/rogue_bid`.
- **Ledger (LOOP-003)**: Persistent SQLite WAL database storing every ticket with SHA-256 audit hashes and a live `/api/reports` metrics endpoint.
- **Predictive ML Forecaster**: Trained low-latency `VotingRegressor` ensemble (Random Forest + XGBoost) achieving 99.62% $R^2$ on solar generation and 84.99% $R^2$ on demand load, loaded into `ForecastingAgent` with zero-downtime naive fallback.
- `npm run build` (frontend) → ✅ static prerender passes
- Live smoke: `POST /tick` → 5 forecasts, 5 decisions, stress 2.34 kW vs 6.0 kW (night tick, correct)

## Current data

- `data/household_15min.csv` — 480 rows (96 ticks × 5 participants), built by
  `data/build_slice.py` from OPSD household_data 2020-04-15 (15-min, cumulative-kWh
  counters diffed to avg-kW). Day: 2016-06-10 (highest-PV June day + EV charging).
- Participants: `solar_home` (res4+PV), `household` (res2 consumer),
  `commercial` (ind2+PV), `ev_station` (ind3 EV sub-meter), `battery_site` (res6+PV).
- `GRIDMESH_STRESS_KW=6.0` calibrated: stress on evening peak only (17/96 ticks).

## Tech decisions locked

- Env/packages: **uv** (`uv sync --extra dev`, `.python-version` 3.14)
- Orchestration: **LangGraph** (`build_graph()` → `CompiledStateGraph`, `run_tick` fallback)
- LLM: **Groq / NVIDIA NIM** (OpenAI-compatible) + cached fallbacks in `data/fallbacks/`
- Ledger: interface now (`TradeLedger`), hash-chain in Phase 4
- Knowledge graph: `graphify . --update` after every change batch

## Next up (Phase 3 entry)

1. Connect the new `/api/reports` metrics to the frontend UI panel.
2. Port visual features from `simulation.html` into the Next.js `frontend/` codebase.
3. Fix LOOP-004: Surface LLM provider fallback status on `/health`.
4. Run full end-to-end rehearsal.
