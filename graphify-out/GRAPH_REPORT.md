# Graph Report - Gridmesh  (2026-09-12)

## Corpus Check
- 3 files · ~20,976 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 592 nodes · 832 edges · 53 communities (22 shown, 24 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend
- Ledger
- Tests
- Tests 3
- API Layer
- Agents
- Tests 6
- Core and Data
- Frontend 8
- PRD
- Ledger 10
- Tracker Docs
- Frontend 12
- Data Pipeline
- Tracker Docs 14
- API Layer 15
- Core and Data 16
- Core and Data 17
- Core and Data 18
- LLM Client
- Data Pipeline 20
- Data Pipeline 21
- PRD 22
- Markers
- Markers 25
- Markers 26
- Markers 27
- Markers 28
- Markers 29
- Markers 31
- Markers 32
- Markers 38
- Markers 39
- Markers 40
- Markers 41
- Markers 42
- Markers 43
- Markers 44
- Markers 45
- Markers 46
- Markers 47
- Markers 48
- Markers 49
- Markers 50
- Markers 51
- Markers 52

## God Nodes (most connected - your core abstractions)
1. `SQLiteLedger` - 30 edges
2. `_trade()` - 16 edges
3. `compilerOptions` - 16 edges
4. `_run()` - 15 edges
5. `ProsumerAgent` - 13 edges
6. `ForecastingAgent` - 12 edges
7. `_peak_shaving()` - 12 edges
8. `_surplus_absorption()` - 12 edges
9. `_get()` - 11 edges
10. `run_tick()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Backend FastAPI LangGraph SQLite Stack` --shares_data_with--> `SQLite WAL Ledger`  [INFERRED]
  README.md → STATUS.md
- `Blockchain Ledger Phase 4 Interface` --conceptually_related_to--> `SQLite WAL Ledger`  [INFERRED]
  README.md → STATUS.md
- `LOOP-003 Ledger In-Memory Only` --conceptually_related_to--> `SQLite WAL Ledger`  [INFERRED]
  docs/BUGLOG.md → STATUS.md
- `LOOP-002 Midday Surplus Wasted` --conceptually_related_to--> `Optimization Dispatch Peak Shaving`  [INFERRED]
  docs/BUGLOG.md → STATUS.md
- `BUG-002 Live LLM Flag Mismatch` --conceptually_related_to--> `5-Rule Compliance Engine`  [INFERRED]
  docs/BUGLOG.md → STATUS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Six-agent intelligence layer system** — gridmesh_prd_multiagent_intelligence_layer, gridmesh_prd_forecasting_agent, gridmesh_prd_grid_health_agent, gridmesh_prd_optimization_agent, gridmesh_prd_prosumer_agent, gridmesh_prd_trading_negotiation_agent, gridmesh_prd_regulation_compliance_agent [EXTRACTED 1.00]
- **Demo Pipeline Replay to Audit Flow** — readme_demo_pipeline, readme_opsd_data_slice, status_ml_forecaster [EXTRACTED 1.00]
- **Phase 2 Sign-off Evidence Bundle** — status_phase_2_agentic_core, status_prosumer_preferences, status_optimization_dispatch, status_regulation_engine, status_sqlite_ledger, status_ml_forecaster [EXTRACTED 1.00]
- **Ledger Persistence Fix Bundle** — docs_buglog_loop_003, docs_buglog_sqliteledger, status_sqlite_ledger, status_reports_api [EXTRACTED 1.00]
- **Regulation Enforcement Bundle** — docs_buglog_bug_001, docs_buglog_rogue_bid, docs_buglog_bug_002, docs_buglog_normalize_flag, status_regulation_engine [EXTRACTED 1.00]

## Communities (53 total, 24 thin omitted)

### Community 0 - "Frontend"
Cohesion: 0.07
Nodes (38): plexMono, plexSans, Page(), Tab, TABS, BlockchainPanel(), ChainBlock, ChainStatus (+30 more)

### Community 1 - "Ledger"
Cohesion: 0.05
Nodes (35): Insert a trade into the SQLite DB. Returns the trade with its new ID., Return all trades ordered by ID., Aggregate stats computed in SQL for O(1) performance., prev_hash = block_hash of the highest block_index below tick, else genesis., Recompute a tick's block hash from DB rows (shared by close/verify)., Mint (or return existing) block for tick over DB-persisted rows. Reads…, Return all blocks ordered by index (chain order)., Cheap existence check: has this tick already been closed? No writes. (+27 more)

### Community 2 - "Tests"
Cohesion: 0.07
Nodes (45): Any, AuditResult, GridHealthAgent, _audit_single(), _log_violation(), _normalize_flag(), Regulation & Compliance Agent: 5-rule deterministic engine + LLM spot-check.…, Run all rules against one trade. Returns AuditResult as dict. (+37 more)

### Community 3 - "Tests 3"
Cohesion: 0.07
Nodes (42): Grid Health Agent: rule-based stress detection, LLM escalation hook., _idle_dispatch(), OptimizationAgent, _peak_shaving(), Any, BaseAgent, Optimization Agent: real surplus-absorption and peak-shaving dispatch engine.…, Per-participant discharge floor: parsed reserve or global default. Reuses… (+34 more)

### Community 4 - "API Layer"
Cohesion: 0.06
Nodes (37): _demo_allowed(), demo_tamper(), get_chain(), BaseModel, post, Blockchain read/verify/demo endpoints (Phase 4). - GET /api/blockchain/chain —…, Return all blocks, most recent first., Run full chain verification and return the result. (+29 more)

### Community 5 - "Agents"
Cohesion: 0.08
Nodes (28): ForecastingAgent, Any, BaseAgent, Forecasting Agent: Ensemble (Random Forest + XGBoost) ML forecaster with…, Live model state for /api/quant/status — same source the agent checks. `active`…, build_graph(), Any, LangGraph wiring: forecast -> health -> optimize -> prosumer -> trade ->… (+20 more)

### Community 6 - "Tests 6"
Cohesion: 0.10
Nodes (32): _find_dispatch_override(), _parse_reserve(), _parse_sell_threshold(), ProsumerAgent, Any, BaseAgent, Prosumer Agent: battery-aware, preference-driven buy/sell/store/consume per…, Extract reserve % from free-text. 'Keep 30% battery reserve' → 30.0 (+24 more)

### Community 7 - "Core and Data"
Cohesion: 0.10
Nodes (21): BaseAgent, Any, Thin agent base: every agent returns dicts with a rationale string., Any, Trading & Negotiation Agent: deterministic clearing + LLM edge-case hook., TradingAgent, In-memory violation log: all flagged audit results across all ticks. Same…, ViolationLog (+13 more)

### Community 8 - "Frontend 8"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 9 - "PRD"
Cohesion: 0.09
Nodes (25): Admin Regulator simulated persona, Blockchain Layer lightweight purpose-built final phase, Build phasing blockchain-last Phase 1 to 5, Carbon and Sustainability Credits tokenized points, Edge Layer energy participants, Electricity Market Data pricing benchmark, Weather API irradiance temperature forecast, Forecasting Agent solar demand price prediction (+17 more)

### Community 10 - "Ledger 10"
Cohesion: 0.11
Nodes (12): ABC, Ledger interface. Phase 1-3: plain table. Phase 4: hash-chained swap-in., Persist a cleared trade, return stored record., Return all stored trades in order., Return cumulative aggregate stats: total_kwh, total_trades, total_value., TradeLedger, _audit_hash(), SQLite implementation of the TradeLedger interface. Provides persistent storage… (+4 more)

### Community 11 - "Tracker Docs"
Cohesion: 0.08
Nodes (24): BUG-002 Live LLM Flag Mismatch, LOOP-001 Agents Ignore battery_kwh, LOOP-002 Midday Surplus Wasted, LOOP-003 Ledger In-Memory Only, _normalize_flag Function, peak_shaving Mode, SQLiteLedger Implementation, surplus_absorption Mode (+16 more)

### Community 12 - "Frontend 12"
Cohesion: 0.08
Nodes (23): dependencies, next, react, react-dom, recharts, devDependencies, @types/node, @types/react (+15 more)

### Community 13 - "Data Pipeline"
Cohesion: 0.16
Nodes (15): build_models(), EnsembleForecaster, evaluate_temporal_split(), get_data_path(), prepare_features(), DataFrame, Path, Train a robust ensemble forecaster (Random Forest + XGBoost) on 30 days of real… (+7 more)

### Community 14 - "Tracker Docs 14"
Cohesion: 0.13
Nodes (15): DOC-001 Spec Deleted in Merge, RES-002 Hardcoded Stress Threshold, RES-006 OPSD Cumulative Counters, BUGLOG Document, build_slice.py, ForecastingAgent, GridMesh Project, gridmesh_prd.md Spec (+7 more)

### Community 15 - "API Layer 15"
Cohesion: 0.25
Nodes (7): clear_violations(), Clear the violation log (useful for resetting demo state)., Wipe all events (useful for test teardown). Returns number cleared., fixture, Clear ViolationLog before each test to avoid cross-test pollution., _reset_log(), delete

### Community 16 - "Core and Data 16"
Cohesion: 0.38
Nodes (3): Simulated clock: 15-min OPSD steps replayed as ticks., SimClock, test_clock_advances()

### Community 17 - "Core and Data 17"
Cohesion: 0.33
Nodes (3): DataFrame, Tick-based replay of OPSD rows on the sim clock., Replay

### Community 19 - "LLM Client"
Cohesion: 0.47
Nodes (4): complete_json(), _fallback(), _provider(), Free-tier LLM client: Groq Cloud / NVIDIA NIM (both OpenAI-compatible). Falls…

### Community 20 - "Data Pipeline 20"
Cohesion: 0.50
Nodes (4): fetch(), main(), Path, Build the GridMesh demo slice from real OPSD household data. Source: Open Power…

### Community 21 - "Data Pipeline 21"
Cohesion: 0.60
Nodes (4): build_multi_day_slice(), download_opsd(), Path, Download OPSD household data and build a multi-day (30 days) dataset for ML…

### Community 22 - "PRD 22"
Cohesion: 0.67
Nodes (3): Explainability NFR human-readable rationale string, Grid Operator simulated persona, Operator Dashboard primary demo surface decision log

## Knowledge Gaps
- **96 isolated node(s):** `BatteryState`, `TickDecision`, `TickStress`, `Tab`, `ChainBlock` (+91 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 283 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SQLiteLedger` connect `Ledger` to `Ledger 10`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `ProsumerAgent` connect `Tests 6` to `Agents`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `_get()` connect `API Layer` to `Tests 3`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `SQLiteLedger` (e.g. with `test_append_audit_with_hash()` and `test_append_stores_trade()`) actually correct?**
  _`SQLiteLedger` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BatteryState`, `TickDecision`, `TickStress` to the rest of the system?**
  _96 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.0660377358490566 - nodes in this community are weakly interconnected._
- **Should `Ledger` be split into smaller, more focused modules?**
  _Cohesion score 0.054901960784313725 - nodes in this community are weakly interconnected._