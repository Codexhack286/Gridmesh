# GridMesh — Bug & Loophole Log

> Append-only. New items go on top under Open with the next ID.
> Format: `### <ID> (<open|fixed>) — title` + *Found*, *Impact*, *Fix/Plan*.
> Move to Fixed with date + verifying evidence when resolved.

## Open

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

### LOOP-003 (fixed 2026-09-12) — Ledger is in-memory only
- *Fix:* Implemented `SQLiteLedger` using stdlib `sqlite3` and swapped it in as the global `LEDGER`. Features WAL mode, persistent storage for trades/audits/violations, and a `GET /api/reports` endpoint computing cumulative metrics natively in SQL.

### LOOP-002 (fixed 2026-09-12) — Midday surplus is mostly wasted
- *Fix:* Optimization Agent rewritten to issue active dispatch commands. Implemented `surplus_absorption` mode (charges EV and batteries during midday peaks) and `peak_shaving` mode (throttles EV and discharges batteries when grid stress hits).

### LOOP-001 (fixed 2026-09-12) — Agents ignore `battery_kwh`
- *Fix:* Threaded `battery_kwh` into `TickData`, converting it to `battery_soc` based on agent capacities in `config.py`. Prosumer agent logic upgraded to strictly honour `reserve_floor` and `sell_threshold` natural-language preferences before trading.

### BUG-001 (fixed 2026-09-12) — No compliance flag fires on organic data
- *Fix:* Built a 5-rule priority-ordered compliance engine in `RegulationAgent` (R-01 through R-05). Created `POST /api/scenario/rogue_bid` to inject illegal trades. Demonstrated automated enforcement (voiding vs alerting) and global `ViolationLog`.

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
