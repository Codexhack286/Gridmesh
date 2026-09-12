# Graph Report - Gridmesh  (2026-09-12)

## Corpus Check
- 21 files · ~34,040 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 618 nodes · 878 edges · 63 communities (28 shown, 28 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Tests
- Frontend Components
- Ledger
- Tests 3
- Mixed
- Mixed 5
- Tests 6
- Frontend Config
- Frontend Config 8
- PRD
- Ledger 10
- Data Pipeline
- Trading Core
- Tracker Docs & Spec
- README
- Scenario & Violations API
- Core and Data
- Core and Data 17
- Core and Data 18
- LLM Client
- Data Pipeline 20
- Data Pipeline 21
- Tracker Docs & Spec 22
- Tracker Docs & Spec 23
- Frontend Page
- Tracker Docs & Spec 25
- Tracker Docs & Spec 26
- Tracker Docs & Spec 27
- Tracker Docs & Spec 28
- Frontend Components 29
- PRD 30
- Markers
- Markers 33
- Markers 34
- Markers 35
- Markers 36
- Markers 37
- Markers 38
- Markers 39
- Markers 41
- Markers 42
- Markers 48
- Markers 49
- Markers 50
- Markers 51
- Markers 52
- Markers 53
- Markers 54
- Markers 55
- Markers 56
- Markers 57
- Markers 58
- Markers 59
- Markers 60
- Markers 61
- Markers 62

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
- `Mockup node inspector badge policy gen load net` --semantically_similar_to--> `Node inspector click-to-select policy gen load net SOC`  [INFERRED] [semantically similar]
  simulation.html → docs/superpowers/specs/2026-09-12-frontend-simulation-ui-design.md
- `Backend FastAPI LangGraph SQLite Stack` --shares_data_with--> `Persistent SQLite WAL ledger with SHA-256 audit hashes and reports endpoint`  [INFERRED]
  README.md → STATUS.md
- `Blockchain Ledger Phase 4 Interface` --conceptually_related_to--> `Persistent SQLite WAL ledger with SHA-256 audit hashes and reports endpoint`  [INFERRED]
  README.md → STATUS.md
- `inject_rogue_bid()` --uses--> `RegulationAgent`  [INFERRED]
  backend/app/api/routes/scenarios.py → backend/app/agents/regulation.py
- `DOC-001 Spec gridmesh_prd.md deleted in merge and restored` --references--> `GridMesh P2P microgrid energy trading project`  [EXTRACTED]
  docs/BUGLOG.md → STATUS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Six-agent intelligence layer system** — gridmesh_prd_multiagent_intelligence_layer, gridmesh_prd_forecasting_agent, gridmesh_prd_grid_health_agent, gridmesh_prd_optimization_agent, gridmesh_prd_prosumer_agent, gridmesh_prd_trading_negotiation_agent, gridmesh_prd_regulation_compliance_agent [EXTRACTED 1.00]
- **Demo Pipeline Replay to Audit Flow** — readme_demo_pipeline, readme_opsd_data_slice, status_ml_forecaster [EXTRACTED 1.00]
- **Single-screen Control Center port from mockup to React** — docs_superpowers_plans_2026_09_12_frontend_simulation_ui_react_port_approach_a, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_header_component, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_synoptic_panel, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_orderbook_panel, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_agent_stream_panel, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_blockchain_banner [EXTRACTED 0.75]
- **Rogue-bid injection to compliance enforcement flow** — status_regulation_engine, docs_superpowers_specs_2026_09_12_frontend_simulation_ui_design_rogue_bid_kinds, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_scenariobar_component, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_agent_stream_panel [EXTRACTED 0.75]
- **Per-tick forecast to telemetry and KPI data flow** — status_opsd_slice, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_usegridstream_tickhistory, docs_superpowers_plans_2026_09_12_frontend_simulation_ui_telemetry_chart, simulation_html_kpi_ribbon [INFERRED 0.75]

## Communities (63 total, 28 thin omitted)

### Community 0 - "Tests"
Cohesion: 0.05
Nodes (53): _idle_dispatch(), OptimizationAgent, _peak_shaving(), Any, BaseAgent, Optimization Agent: real surplus-absorption and peak-shaving dispatch engine.…, Per-participant discharge floor: parsed reserve or global default. Reuses…, Discharge highest-SOC batteries then throttle EV to cover evening demand… (+45 more)

### Community 1 - "Frontend Components"
Cohesion: 0.07
Nodes (44): Page(), AGENT_META, AgentStreamPanel(), DecisionEntry, tickClock(), BlockchainBanner(), ChainBlock, truncateHash() (+36 more)

### Community 2 - "Ledger"
Cohesion: 0.05
Nodes (35): Insert a trade into the SQLite DB. Returns the trade with its new ID., Return all trades ordered by ID., Aggregate stats computed in SQL for O(1) performance., prev_hash = block_hash of the highest block_index below tick, else genesis., Recompute a tick's block hash from DB rows (shared by close/verify)., Mint (or return existing) block for tick over DB-persisted rows. Reads…, Return all blocks ordered by index (chain order)., Cheap existence check: has this tick already been closed? No writes. (+27 more)

### Community 3 - "Tests 3"
Cohesion: 0.07
Nodes (45): Any, AuditResult, GridHealthAgent, _audit_single(), _log_violation(), _normalize_flag(), Regulation & Compliance Agent: 5-rule deterministic engine + LLM spot-check.…, Run all rules against one trade. Returns AuditResult as dict. (+37 more)

### Community 4 - "Mixed"
Cohesion: 0.08
Nodes (30): ForecastingAgent, Any, BaseAgent, Forecasting Agent: Ensemble (Random Forest + XGBoost) ML forecaster with…, Live model state for /api/quant/status — same source the agent checks. `active`…, build_graph(), Any, LangGraph wiring: forecast -> health -> optimize -> prosumer -> trade ->… (+22 more)

### Community 5 - "Mixed 5"
Cohesion: 0.06
Nodes (37): _demo_allowed(), demo_tamper(), get_chain(), BaseModel, post, Blockchain read/verify/demo endpoints (Phase 4). - GET /api/blockchain/chain —…, Return all blocks, most recent first., Run full chain verification and return the result. (+29 more)

### Community 6 - "Tests 6"
Cohesion: 0.10
Nodes (32): _find_dispatch_override(), _parse_reserve(), _parse_sell_threshold(), ProsumerAgent, Any, BaseAgent, Prosumer Agent: battery-aware, preference-driven buy/sell/store/consume per…, Extract reserve % from free-text. 'Keep 30% battery reserve' → 30.0 (+24 more)

### Community 7 - "Frontend Config"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 8 - "Frontend Config 8"
Cohesion: 0.08
Nodes (25): chart.js, dependencies, chart.js, next, react, react-dom, recharts, devDependencies (+17 more)

### Community 9 - "PRD"
Cohesion: 0.09
Nodes (25): Admin Regulator simulated persona, Blockchain Layer lightweight purpose-built final phase, Build phasing blockchain-last Phase 1 to 5, Carbon and Sustainability Credits tokenized points, Edge Layer energy participants, Electricity Market Data pricing benchmark, Weather API irradiance temperature forecast, Forecasting Agent solar demand price prediction (+17 more)

### Community 10 - "Ledger 10"
Cohesion: 0.11
Nodes (12): ABC, Ledger interface. Phase 1-3: plain table. Phase 4: hash-chained swap-in., Persist a cleared trade, return stored record., Return all stored trades in order., Return cumulative aggregate stats: total_kwh, total_trades, total_value., TradeLedger, _audit_hash(), SQLite implementation of the TradeLedger interface. Provides persistent storage… (+4 more)

### Community 11 - "Data Pipeline"
Cohesion: 0.16
Nodes (15): build_models(), EnsembleForecaster, evaluate_temporal_split(), get_data_path(), prepare_features(), DataFrame, Path, Train a robust ensemble forecaster (Random Forest + XGBoost) on 30 days of real… (+7 more)

### Community 12 - "Trading Core"
Cohesion: 0.23
Nodes (8): BaseAgent, Any, Thin agent base: every agent returns dicts with a rationale string., Any, Trading & Negotiation Agent: deterministic clearing + LLM edge-case hook., TradingAgent, Trade, test_clearing_pairs_surplus_deficit()

### Community 13 - "Tracker Docs & Spec"
Cohesion: 0.15
Nodes (13): BUG-003 Trade ticker dropped ledger history index vs id, Header component brand clock status pill pause resume reset, Light theme tokens fonts icons dashboard.css, OrderbookPanel bids asks benchmarks trade ticker, Approach A React component port of simulation.html mockup, SynopticPanel KPIs SVG topology inspector, Single-screen GridMesh Control Center goal zero backend changes, tickClock helper 96x15min day HH MM (+5 more)

### Community 14 - "README"
Cohesion: 0.18
Nodes (11): LOOP-003 Ledger in-memory only fixed by SQLiteLedger, BlockchainBanner collapsible hash-chain stream verify, Backend FastAPI LangGraph SQLite Stack, Blockchain Ledger Phase 4 Interface, Demo Pipeline Replay to Regulation Audit, Grid Health Stress Threshold GRIDMESH_STRESS_KW, GridMesh Agentic P2P Micro-Grid Trading, LLM Cached Fallback Offline Demo Resilience (+3 more)

### Community 15 - "Scenario & Violations API"
Cohesion: 0.25
Nodes (7): clear_violations(), Clear the violation log (useful for resetting demo state)., Wipe all events (useful for test teardown). Returns number cleared., fixture, Clear ViolationLog before each test to avoid cross-test pollution., _reset_log(), delete

### Community 16 - "Core and Data"
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

### Community 22 - "Tracker Docs & Spec 22"
Cohesion: 0.50
Nodes (5): LOOP-005 WebSocket path untested and unused, Auto-tick loop 4s interval with in-flight guard and auto-pause, TelemetryChart Chart.js line chart ssr false, useGridStream extension tickHistory tickFailed reset, Mockup telemetry Chart.js solar vs load trend

### Community 23 - "Tracker Docs & Spec 23"
Cohesion: 0.50
Nodes (4): ScenarioBar with Normal plus 5 rogue-bid injection buttons, Dropped mockup scenarios solar_peak ev_surge blackout, Five real rogue-bid kinds predatory_price bulk_dump self_trade collusion feeder_overload, Mockup scenario bar normal solar_peak ev_surge blackout

### Community 25 - "Tracker Docs & Spec 25"
Cohesion: 0.67
Nodes (3): BUG-001 No compliance flag fires on organic data, BUG-002 Live LLM flag none vs empty string normalize, 5-rule compliance engine R-01 to R-05 with rogue_bid scenario endpoint

### Community 26 - "Tracker Docs & Spec 26"
Cohesion: 0.67
Nodes (3): DOC-001 Spec gridmesh_prd.md deleted in merge and restored, GridMesh P2P microgrid energy trading project, Phase 2 Agentic Core signed off 2026-09-12, 55 pytest passed

### Community 27 - "Tracker Docs & Spec 27"
Cohesion: 0.67
Nodes (3): LOOP-004 Silent LLM fallback with no health warning, Predictive ML Forecaster VotingRegressor RF plus XGBoost, OPSD household_15min.csv slice 96 ticks x 5 participants 2016-06-10

### Community 28 - "Tracker Docs & Spec 28"
Cohesion: 0.67
Nodes (3): AgentStreamPanel live decision-log transcript 30 cards, useViolations hook with getViolations clearViolations, Mockup agent transcript forecasting prosumer trading grid regulation

### Community 30 - "PRD 30"
Cohesion: 0.67
Nodes (3): Explainability NFR human-readable rationale string, Grid Operator simulated persona, Operator Dashboard primary demo surface decision log

## Ambiguous Edges - Review These
- `LOOP-005 WebSocket path untested and unused` → `Auto-tick loop 4s interval with in-flight guard and auto-pause`  [AMBIGUOUS]
  docs/BUGLOG.md · relation: conceptually_related_to

## Knowledge Gaps
- **105 isolated node(s):** `ChainBlock`, `Blockchain Ledger Phase 4 Interface`, `Grid Health Stress Threshold GRIDMESH_STRESS_KW`, `OPSD Household Data Slice household_15min`, `Explainability NFR human-readable rationale string` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 294 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `LOOP-005 WebSocket path untested and unused` and `Auto-tick loop 4s interval with in-flight guard and auto-pause`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `SQLiteLedger` connect `Ledger` to `Ledger 10`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `ProsumerAgent` connect `Tests 6` to `Mixed`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `_get()` connect `Mixed 5` to `Mixed`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `SQLiteLedger` (e.g. with `test_append_audit_with_hash()` and `test_append_stores_trade()`) actually correct?**
  _`SQLiteLedger` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ChainBlock`, `Blockchain Ledger Phase 4 Interface`, `Grid Health Stress Threshold GRIDMESH_STRESS_KW` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.054098360655737705 - nodes in this community are weakly interconnected._