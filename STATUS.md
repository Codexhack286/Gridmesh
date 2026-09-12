# GridMesh — Project Status

> Living document. Update on every phase transition or verification run.
> Last updated: 2026-09-12 · Phase 1 signed off · `uv run pytest`: **4 passed**

Spec: `gridmesh_prd.md` · Issues: `docs/BUGLOG.md` · Quickstart: `README.md`

## Phase tracker (PRD §8)

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation (hrs 0–9) | Data replay, Forecasting, deterministic clearing, Grid Health stress, dashboard shell | ✅ **Complete** (signed off 2026-09-12) |
| 2 — Agentic Core (hrs 9–17) | LLM prosumer prefs, Optimization dispatch, Regulation edge cases, negotiation, full decision log | ⬜ Not started |
| 3 — Freeze & Harden (hrs 18–20) | Bug fixes only, stats/reports panel | ⬜ Blocked on Phase 2 |
| 4 — Blockchain Layer (hrs 20–22) | Hash-chained ledger, pseudonymous IDs, contract sim, carbon credits — only if Phases 1–3 stable | ⬜ Scoped (interface exists: `backend/app/ledger/interface.py`) |
| 5 — Pitch & Rehearsal (hrs 22–24) | Demo script, rehearsal, backup video | ⬜ Not started |

## Phase 1 sign-off evidence

- `uv run pytest -q` → **4 passed** (`test_clock`, `test_clearing`, `test_ledger`, `test_tick`)
- Full demo-day run (96 ticks, real OPSD slice 2016-06-10): **68 trades** @ 0.255/kWh,
  **17 stress ticks** (peak 7.07 kW @ 20:00 vs 6.0 threshold), **68 audits / 0 flags**,
  every tick with a rationale-bearing decision log
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

## Next up (Phase 2 entry)

1. Prosumer free-text preference parsing ("keep 30% battery reserve") — needs agents to
   actually read `battery_kwh` (see BUGLOG LOOP-001)
2. Optimization dispatch wired to real flexibility (LOOP-002)
3. Regulation edge-case / fairness-dispute path + demo flag injector (BUG-001)
4. Reports & Insights panel (PRD 4.2.12)
