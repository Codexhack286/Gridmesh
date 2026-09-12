# GridMesh — Agentic P2P Micro-Grid Trading

AI Agents for a Cleaner, Fairer, Smarter Energy Future.

**Status:** Phase 1 (Foundation) ✅ complete — see [`STATUS.md`](STATUS.md).
Open bugs/loopholes: [`docs/BUGLOG.md`](docs/BUGLOG.md).

## Quickstart (scaffold)

```powershell
# backend (uv manages env + packages)
uv sync --extra dev
uv run uvicorn app.main:app --reload --app-dir backend

# frontend
Set-Location frontend; npm install; npm run dev
```

Copy `.env.example` to `.env` and set `GROQ_API_KEY` and/or `NIM_API_KEY`.
Without keys the LLM agents use cached fallbacks in `data/fallbacks/` (offline demo resilience per PRD NFR).
`GRIDMESH_STRESS_KW` tunes the Grid Health threshold (default 6.0, calibrated to the demo slice).

## Layout

- `backend/` — FastAPI + LangGraph agents + SQLite
- `frontend/` — Next.js Operator Dashboard (primary demo surface)
- `data/` — real OPSD day slice (`household_15min.csv`, built by `build_slice.py`) + LLM fallback responses
- `docs/` — `BUGLOG.md` (bugs/loopholes), `superpowers/` (specs/plans)
- `graphify-out/` — knowledge graph (`graph.html`, `GRAPH_REPORT.md`, `graph.json`)

## Data provenance

`data/household_15min.csv` (480 rows: 96 ticks × 5 participants, day 2016-06-10) is built from
Open Power System Data household_data 2020-04-15 (15-min). Raw columns are cumulative kWh
counters — `data/build_slice.py` diffs them to avg-kW. Re-run
`uv run python data/build_slice.py` to regenerate (downloads ~60 MB once, cached in `data/.cache/`).

## Demo path

OPSD replay on sim clock → Forecasting → Grid Health stress → Optimization dispatch →
Prosumer decisions → Trading clears with price → Regulation audits → Dashboard decision log.
Blockchain ledger is Phase 4 (interface now, hash-chain later).
