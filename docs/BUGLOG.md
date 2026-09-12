# GridMesh — Bug & Loophole Log

> Append-only. New items go on top under Open with the next ID.
> Format: `### <ID> (<open|fixed>) — title` + *Found*, *Impact*, *Fix/Plan*.
> Move to Fixed with date + verifying evidence when resolved.

## Open

### BUG-001 (open) — No compliance flag fires on organic data
- *Found:* 2026-09-12, full-day run: 68 audits, 0 flags.
- *Impact:* PRD success metric wants ≥1 flag demoed; Regulation Agent looks decorative.
- *Plan:* Phase 2 — LLM fairness-dispute path (PRD 4.2.13) + demo "rogue bid" injector.
  Do NOT lower `MAX_QTY_KWH` to fake it.

### LOOP-001 (open) — Agents ignore `battery_kwh`
- *Found:* 2026-09-12, code inspection.
- *Impact:* "Keep 30% battery reserve" preferences (PRD 4.2.10) can't work; battery
  column is simulated in data but never read by Prosumer/Optimization agents.
- *Plan:* Phase 2 — thread battery state into `run_tick` state + prosumer constraints.

### LOOP-002 (open) — Midday surplus is mostly wasted
- *Found:* 2026-09-12, slice stats: 240 kWh PV vs 57 kWh load; trades capped at
  buyer demand, excess has nowhere to go.
- *Impact:* Weakens the optimization story; batteries should absorb it.
- *Plan:* Phase 2 — Optimization dispatch charges storage/EV from surplus (needs LOOP-001).

### LOOP-003 (open) — Ledger is in-memory only
- *Found:* 2026-09-12, code inspection (`ledger/table.py`).
- *Impact:* Trade history resets on restart; no audit durability for the demo.
- *Plan:* SQLite persistence pre-Phase 4; hash-chain replaces it in Phase 4.

### LOOP-004 (open) — Silent LLM fallback
- *Found:* 2026-09-12, code inspection (`llm/client.py`).
- *Impact:* Missing/bad API keys degrade to cached responses with no warning;
  demo could run "successfully" on rails without anyone noticing.
- *Plan:* Log a warning + surface provider status on `/health`.

### LOOP-005 (open) — WebSocket path untested and unused
- *Found:* 2026-09-12, code inspection.
- *Impact:* `/ws/stream` has no test coverage and the dashboard polls via REST
  (`postTick`), so the WS story is unverified.
- *Plan:* Add a WS test; either use it in `useGridStream` or cut it before freeze.

## Fixed

### RES-006 (fixed 2026-09-12) — OPSD raw columns are cumulative counters
- *Found:* Day-profile inspection (flat 24/7 values).
- *Fix:* `data/build_slice.py` diffs counters → avg-kW. Evidence: realistic
  profiles (8 kWh/day household, 40 kWh/day rooftop yield).

### RES-005 (fixed 2026-09-12) — pip/venv replaced by uv
- *Fix:* `uv sync --extra dev`, `.python-version`, pytest `pythonpath` ini.
  Evidence: `uv run pytest` 4 passed, LangGraph resolves to `CompiledStateGraph`.

### RES-004 (fixed 2026-09-12) — Frontend shell unverified
- *Fix:* `npm install` + `npm run build` passes (static prerender).

### RES-003 (fixed 2026-09-12) — 4-tick hand sample, no real-data credibility
- *Fix:* Real OPSD day slice (96 ticks × 5), loader fallback preserved.
  Evidence: 68 trades / 17 stress ticks on full-day run.

### RES-002 (fixed 2026-09-12) — Hardcoded stress threshold
- *Fix:* `GRIDMESH_STRESS_KW` env (default 6.0), calibrated to slice.

### RES-001 (fixed 2026-09-12) — `import app` needed PYTHONPATH hack
- *Fix:* setuptools `packages.find where=["backend"]` + pytest ini. Evidence:
  bare `uv run pytest` green.
