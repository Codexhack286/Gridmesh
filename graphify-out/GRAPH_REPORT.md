# Graph Report - Gridmesh  (2026-09-12)

## Corpus Check
- 3 files · ~6,929 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 274 nodes · 316 edges · 41 communities (18 shown, 17 thin omitted)
- Extraction: 94% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Agent Pipeline Core
- TypeScript Config
- PRD Domain Concepts
- API Routes and Config
- Frontend Dependencies
- Prosumer and Regulation
- Ledger Interface
- Dashboard Components
- Grid Health and Config
- Sim Clock
- Tick Pipeline and Replay
- Status and Data Provenance
- Agent Bus
- Buglog and Phase 2
- Slice Builder
- LLM Providers
- Ledger Plans
- Operator Dashboard
- Phase 1 Signoff
- Backend Package Init
- WS Test Gap
- Next Env Types
- Comms and LangGraph
- Package Init Markers
- Package Init Markers
- UV Migration Note
- Data Infra Layer
- Platform Identity
- Offline Resilience
- Consumer Persona
- FastAPI Stack
- Package Init Markers
- Python Packaging
- Backend Stack Note
- LangGraph Note

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `BaseAgent` - 12 edges
3. `TradingAgent` - 7 edges
4. `TableLedger` - 7 edges
5. `complete_json()` - 7 edges
6. `TradeLedger` - 6 edges
7. `Multi-Agent Intelligence Layer six agents` - 6 edges
8. `ForecastingAgent` - 5 edges
9. `ProsumerAgent` - 5 edges
10. `RegulationAgent` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Grid Health Stress Threshold GRIDMESH_STRESS_KW` --semantically_similar_to--> `Stress Calibration 6.0 kW Evening Peak Only`  [INFERRED] [semantically similar]
  README.md → STATUS.md
- `LOOP-005 WebSocket path untested and unused` --conceptually_related_to--> `Frontend Next.js Operator Dashboard`  [AMBIGUOUS]
  docs/BUGLOG.md → README.md
- `RES-006 OPSD cumulative counters diffed to avg-kW` --conceptually_related_to--> `Household 15min OPSD Day Slice 2016-06-10`  [INFERRED]
  docs/BUGLOG.md → README.md
- `Household 15min OPSD Day Slice 2016-06-10` --shares_data_with--> `Full Demo Day Run 96 Ticks 68 Trades`  [INFERRED]
  README.md → STATUS.md
- `LOOP-004 Silent LLM fallback` --conceptually_related_to--> `Offline Demo Resilience via Cached LLM Fallbacks`  [INFERRED]
  docs/BUGLOG.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Six-agent intelligence layer system** — gridmesh_prd_multiagent_intelligence_layer, gridmesh_prd_forecasting_agent, gridmesh_prd_grid_health_agent, gridmesh_prd_optimization_agent, gridmesh_prd_prosumer_agent, gridmesh_prd_trading_negotiation_agent, gridmesh_prd_regulation_compliance_agent [EXTRACTED 1.00]
- **Demo pipeline flow from replay to audit** — readme_household_slice, readme_demo_pipeline, status_demo_day_run, status_ledger_interface [EXTRACTED 1.00]
- **Phase tracker Phases 1 2 and 4** — status_phase_1_signoff, status_phase_2_agentic_core, status_phase_4_blockchain_ledger [EXTRACTED 1.00]
- **Open bugs and loopholes group** — docs_buglog_bug_001, docs_buglog_loop_001, docs_buglog_loop_002, docs_buglog_loop_003, docs_buglog_loop_004, docs_buglog_loop_005 [EXTRACTED 1.00]

## Communities (41 total, 17 thin omitted)

### Community 0 - "Agent Pipeline Core"
Cohesion: 0.10
Nodes (21): BaseAgent, Any, Thin agent base: every agent returns dicts with a rationale string., ForecastingAgent, Any, Forecasting Agent: deterministic seasonal-naive over replay rows., build_graph(), Any (+13 more)

### Community 1 - "TypeScript Config"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 2 - "PRD Domain Concepts"
Cohesion: 0.09
Nodes (25): Admin Regulator simulated persona, Blockchain Layer lightweight purpose-built final phase, Build phasing blockchain-last Phase 1 to 5, Carbon and Sustainability Credits tokenized points, Edge Layer energy participants, Electricity Market Data pricing benchmark, Weather API irradiance temperature forecast, Forecasting Agent solar demand price prediction (+17 more)

### Community 3 - "API Routes and Config"
Cohesion: 0.11
Nodes (17): health(), Tick route: advance sim clock, run LangGraph pipeline, ledger trades., tick(), Trade ledger read route., trades(), WebSocket live stream: pushes a fresh tick payload per message., stream(), _get() (+9 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, next, react, react-dom, recharts, devDependencies, @types/node, @types/react (+15 more)

### Community 5 - "Prosumer and Regulation"
Cohesion: 0.15
Nodes (16): ProsumerAgent, Any, Prosumer Agent: LLM-driven buy/sell/store/consume per participant., Any, Regulation & Compliance Agent: rule audit + LLM reasoning over flags., RegulationAgent, AuditResult, DecisionLog (+8 more)

### Community 6 - "Ledger Interface"
Cohesion: 0.17
Nodes (8): ABC, Ledger interface. Phase 1-3: plain table. Phase 4: hash-chained swap-in., Persist a cleared trade, return stored record., Return all stored trades in order., TradeLedger, Plain in-memory trade-log table (Phase 4 replaces with hash-chained rows)., TableLedger, test_ledger_interface_appends_in_order()

### Community 7 - "Dashboard Components"
Cohesion: 0.21
Nodes (8): Page(), DecisionLog(), ForecastChart(), StressBanner(), TradeLedger(), useGridStream(), API_BASE, postTick()

### Community 8 - "Grid Health and Config"
Cohesion: 0.25
Nodes (5): Any, GridHealthAgent, Grid Health Agent: rule-based stress detection, LLM escalation hook., Runtime config from environment., BaseAgent

### Community 9 - "Sim Clock"
Cohesion: 0.38
Nodes (3): Simulated clock: 15-min OPSD steps replayed as ticks., SimClock, test_clock_advances()

### Community 10 - "Tick Pipeline and Replay"
Cohesion: 0.33
Nodes (3): DataFrame, Tick-based replay of OPSD rows on the sim clock., Replay

### Community 11 - "Status and Data Provenance"
Cohesion: 0.29
Nodes (7): RES-006 OPSD cumulative counters diffed to avg-kW, Demo Pipeline from OPSD Replay to Regulation Audit, Household 15min OPSD Day Slice 2016-06-10, Open Power System Data household_data 2020-04-15, Grid Health Stress Threshold GRIDMESH_STRESS_KW, Full Demo Day Run 96 Ticks 68 Trades, Stress Calibration 6.0 kW Evening Peak Only

### Community 13 - "Buglog and Phase 2"
Cohesion: 0.40
Nodes (6): battery_kwh state column, BUG-001 No compliance flag fires on organic data, LOOP-001 Agents ignore battery_kwh, LOOP-002 Midday surplus mostly wasted, Rogue Bid Demo Injector Mechanism, Phase 2 Agentic Core

### Community 14 - "Slice Builder"
Cohesion: 0.50
Nodes (4): fetch(), main(), Path, Build the GridMesh demo slice from real OPSD household data. Source: Open Power…

### Community 15 - "LLM Providers"
Cohesion: 0.40
Nodes (5): llm client.py silent fallback, LOOP-004 Silent LLM fallback, Offline Demo Resilience via Cached LLM Fallbacks, GridMesh Agentic P2P Micro-Grid Trading, Groq NVIDIA NIM LLM with Cached Fallbacks

### Community 16 - "Ledger Plans"
Cohesion: 0.50
Nodes (4): ledger table.py in-memory store, LOOP-003 Ledger in-memory only, TradeLedger Interface Hash-Chain Deferred, Phase 4 Blockchain Layer

### Community 17 - "Operator Dashboard"
Cohesion: 0.67
Nodes (3): Explainability NFR human-readable rationale string, Grid Operator simulated persona, Operator Dashboard primary demo surface decision log

### Community 18 - "Phase 1 Signoff"
Cohesion: 0.67
Nodes (3): Phase 1 Foundation Complete, Phase 1 Foundation Sign-off 2026-09-12, PRD Spec gridmesh_prd.md Section 8

## Ambiguous Edges - Review These
- `Frontend Next.js Operator Dashboard` → `LOOP-005 WebSocket path untested and unused`  [AMBIGUOUS]
  docs/BUGLOG.md · relation: conceptually_related_to

## Knowledge Gaps
- **74 isolated node(s):** `allowJs`, `esModuleInterop`, `incremental`, `isolatedModules`, `jsx` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 140 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Frontend Next.js Operator Dashboard` and `LOOP-005 WebSocket path untested and unused`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `_get()` connect `API Routes and Config` to `Grid Health and Config`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `allowJs`, `esModuleInterop`, `incremental` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Pipeline Core` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `PRD Domain Concepts` be split into smaller, more focused modules?**
  _Cohesion score 0.08666666666666667 - nodes in this community are weakly interconnected._
- **Should `API Routes and Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10869565217391304 - nodes in this community are weakly interconnected._