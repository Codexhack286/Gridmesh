# GridMesh — Product Requirements Document
**AI Agents for a Cleaner, Fairer, Smarter Energy Future**
*Local Energy. Intelligent Agents. Trusted Trading.*

---

## 1. Overview

GridMesh is a multi-agent, agentic-AI platform for decentralized micro-grid energy trading. It monitors hyper-local generation and consumption across households, businesses, and EVs; forecasts demand and supply; autonomously negotiates and executes peer-to-peer energy trades; predicts and responds to grid stress; and (as a later-phase capability) settles trades transparently via a lightweight blockchain layer with tokenized sustainability credits.

**Track:** Decentralised Energy Systems & Micro-Grids
**Format:** Agentic AI hackathon submission

### 1.1 Vision Statement
A self-organizing, transparent, and sustainable energy ecosystem where autonomous agents — not centralized utilities — coordinate local energy flow, make it fairer and cheaper for participants, and make communities more resilient to grid failure.

### 1.2 Problem Statement
Local generation (rooftop solar, home batteries, EVs) is increasingly common, but there is no intelligent, autonomous layer that lets neighbors trade surplus energy directly, predicts grid stress before it happens, or gives communities visibility and control over their own energy flow. Existing smart-meter/grid systems are largely passive monitoring tools, not agents that reason, negotiate, and act.

### 1.3 Goals
- Demonstrate genuine agentic AI: agents that reason, plan, use tools, and coordinate with each other — not a dashboard with an LLM caption generator bolted on.
- Show a believable, real-data-driven simulation of P2P energy trading and grid-stress response.
- Build something that could credibly extend into a real neighborhood pilot, not just a demo toy.
- Meet all hackathon judging criteria: Problem Understanding & Impact, Innovation & Creativity, Agentic AI Implementation, Technical Implementation, Solution Effectiveness & Usability, Demo & Presentation.

### 1.4 Non-Goals (for this build)
- GridMesh is **not** attempting to control real physical grid hardware or interface with a real utility.
- GridMesh is **not** attempting a production-grade blockchain deployment — the blockchain layer is a lightweight, purpose-built demonstration, not an audited financial system.
- GridMesh does **not** claim regulatory compliance with any real jurisdiction's energy trading law; the Regulation & Compliance agent simulates this function for demo purposes.

---

## 2. Users & Personas

| Persona | Description | Primary Needs |
|---|---|---|
| **Prosumer** | A household/business with solar + optional battery, produces and consumes energy | Wants to sell surplus profitably, save money, set simple preferences (e.g. "keep 30% battery reserve") |
| **Pure Consumer** | A household/business with no generation | Wants cheaper energy than grid price, wants to know about outages/stress in advance |
| **Grid Operator (simulated)** | Oversees the local micro-grid's health | Needs visibility into stress events, agent decisions, and system-wide stats |
| **Admin/Regulator (simulated)** | Oversees compliance and fairness of trades | Needs audit logs, policy enforcement visibility, dispute flags |

---

## 3. System Architecture

GridMesh is organized into six layers, per the team's architecture diagram. **Build priority runs top-down through the Multi-Agent Intelligence Layer first; the Blockchain Layer is explicitly the last layer implemented**, after the core agent system is working end to end (see Section 8, Build Phasing).

### 3.1 Edge Layer — Energy Participants
Represents the real-world (or simulated) data sources feeding the system:
- **Solar Home** — solar generation, consumption, smart meter data
- **Household/Apartment** — consumption, optional battery, flexible loads (HVAC, appliances)
- **Commercial/Industrial** — high/variable demand, on-site generation, byproduct energy, smart meter
- **EV Charging Station** — charging demand, vehicle-to-grid (V2G) capability, availability & state of charge
- **Battery Storage Unit** — charge/discharge state, capacity, health status
- **Local Sensors** — weather (irradiance, temperature), grid voltage/frequency, equipment status

*For the hackathon build, this layer is a replay of the Open Power System Data household dataset on a simulated clock, standing in for live IoT/MQTT feeds.*

### 3.2 Multi-Agent Intelligence Layer
The core agentic system. Six agents, communicating via the layer below.

| Agent | Responsibility | Reasoning Type |
|---|---|---|
| **Forecasting Agent** | Predicts solar generation, local demand, weather-based forecasts, price prediction | Deterministic/ML (regression or heuristic) |
| **Grid Health Agent** | Monitors grid stability, detects failure risk, anomaly detection, triggers local islanding | Deterministic/rule-based, with LLM escalation reasoning |
| **Optimization Agent** | Optimizes energy flow, schedules storage/EV charging, minimizes cost & emissions, handles constraints | Deterministic (LP/greedy heuristic) |
| **Prosumer Agent** *(one per participant)* | Manages a participant's local assets, decides buy/sell/store/consume, learns/applies user preferences, negotiates with other agents | LLM-driven reasoning, genuine agent-to-agent negotiation |
| **Trading & Negotiation Agent** | Matches buyers and sellers, sets dynamic P2P pricing, executes trades, ensures fair/transparent outcomes | Hybrid — deterministic clearing algorithm + LLM-mediated negotiation for edge cases |
| **Regulation & Compliance Agent** | Enforces local grid rules, checks regulatory limits, verifies participant identity, audits transactions, flags disputes | LLM reasoning over rules + structured audit logging |

### 3.3 Agent Communication Layer
- Publish/Subscribe messaging (MQTT/Kafka pattern, simplified for hackathon scale)
- Agent-to-agent messaging (LangGraph or AutoGen-style orchestration)
- Event-driven coordination (agents act on state changes, not fixed polling where possible)

### 3.4 Blockchain Layer (Lightweight, Purpose-Built) — **Final Build Phase**
Deliberately scoped last and smallest, added only once the core agent system works end-to-end:
- **Participant Identity** — pseudonymous DID, prosumer/asset verification, role-based access
- **Smart Contracts** — automate P2P trade settlement, transparent terms, incentive logic (e.g. green credits)
- **Transaction Ledger** — immutable, auditable record of energy trades
- **Carbon & Sustainability Credits** — tracks renewable contribution, issues tokenized credits, enables community incentives

*Hackathon scope: this is simulated with an append-only, cryptographically-hashed local ledger (hash-chained SQLite rows) rather than a real chain deployment — this preserves the "immutable, auditable" property that matters for the demo narrative without the infrastructure risk of standing up a real chain (even a lightweight L2) in the time available.*

### 3.5 Data & Infrastructure Layer
- **Data Ingestion** — IoT/meter data, external APIs, validation & cleaning
- **Time Series DB** — high-frequency data storage, historical trends (SQLite for hackathon; InfluxDB/TimescaleDB noted as the production path)
- **Analytics & ML** — forecasting models, anomaly detection, optimization engines
- **Backend Services** — agent orchestration, REST/GraphQL APIs, real-time WebSocket
- **Application DB** — user data, preferences, system state
- **Monitoring & Logging** — agent performance, system health, alerts & observability

### 3.6 External Data & Systems
- **Weather API** — solar irradiance, temperature, forecast (used by Forecasting Agent)
- **Electricity Market Data** — real-time prices, demand-supply trends (used as pricing benchmark)
- **Grid Operator/Utility (simulated)** — grid load, outage alerts, regulatory signals
- **Maps/GIS** — location data, grid topology (stretch — not required for MVP)
- **Regulatory/Policy DB** — net metering rules, carbon credit rules, local compliance rules (feeds the Regulation & Compliance Agent's rubric)

### 3.7 User Interfaces
- **Participant App** — view generation/consumption, set preferences, view trades & earnings, notifications
- **Operator Dashboard** — real-time grid view, agent decisions, alerts & interventions, historical analytics
- **Admin/Regulator Portal** — compliance monitoring, audit logs, policy management, data export

*Hackathon scope: Operator Dashboard is the primary build target (it's what you demo). Participant App and Admin Portal are simplified views within the same frontend, not separate applications.*

### 3.8 Outputs & Actions
- **Autonomous Decisions** — buy/sell/store energy, schedule flexible loads, island from main grid if needed, discharge batteries/V2G
- **Alerts & Notifications** — grid failure risk, price spikes, policy violations, app/SMS/email (simulated — no real SMS/email send required for demo)
- **Reports & Insights** — energy savings, renewable utilization, emissions reduction, grid stability metrics

---

## 4. Functional Requirements

### 4.1 Must-Have (MVP — Core Demo Path)
1. System ingests and replays real household energy data (OPSD dataset) on a simulated clock for 4-6 participants.
2. Forecasting Agent produces next-interval load/generation predictions per participant.
3. Grid Health Agent detects a stress condition (aggregate demand approaching a threshold) from live simulated data.
4. Optimization Agent proposes a battery/EV dispatch schedule given forecasts and price.
5. Prosumer Agents (one per participant) autonomously decide buy/sell/store/consume based on their state and a stated preference.
6. Trading & Negotiation Agent clears at least one real P2P trade per simulated tick where a surplus/deficit pairing exists, with a visible clearing price.
7. Regulation & Compliance Agent audits each cleared trade against a simple rule set and can flag a violation.
8. Operator Dashboard shows: live participant forecasts, live trade ledger, a grid-stress alert, and an agent "decision log" (transcript of what each agent reasoned and did).
9. System produces a plain-language explanation for at least one trade and one stress-response decision.

### 4.2 Should-Have (Build if Core Path Is Solid by Hour 14-15)
10. Prosumer Agent parses a free-text preference ("I want to save money but keep 30% battery reserve") into structured trading constraints.
11. Grid Health Agent triggers a simulated "local islanding" event and the dashboard visibly reflects it.
12. Reports & Insights view: cumulative energy savings, renewable utilization %, emissions reduction estimate.
13. Second/edge-case negotiation handled by LLM reasoning rather than the deterministic clearing algorithm (e.g., a tie or a fairness dispute).

### 4.3 Stretch (Final Build Phase — Blockchain Layer)
14. Append-only, hash-chained transaction ledger replacing the plain trade-log table, presented as the "Blockchain Layer" in the demo.
15. Simple pseudonymous participant identity scheme (hashed ID, not a real DID implementation).
16. A basic "smart contract" simulation: a Python function that encodes trade terms and executes automatically when conditions are met, logged distinctly from ordinary trades.
17. Carbon/sustainability credit counter: a simple point system crediting renewable-sourced trades, displayed on the dashboard.
18. Maps/GIS view of participant locations/grid topology.

**Explicit priority rule:** if Hour 18 (feature freeze) arrives and Section 4.3 items are incomplete, they are cut, not the Section 4.1 items. The blockchain layer existing only as a "future work" slide is an acceptable, planned outcome — a broken core agent demo is not.

---

## 5. Non-Functional Requirements
- **Reliability over sophistication:** every agent must produce a valid, demoable output on the scripted demo path even if the underlying model is a simplified heuristic.
- **Explainability:** every autonomous decision (trade, stress response, dispatch) must produce a human-readable rationale string — this is core to both the "agentic" credibility and the judging criteria on usability.
- **Offline resilience for the core path:** the OPSD data replay and deterministic agents must run fully offline; only LLM-dependent reasoning agents require live API access, with cached fallback responses prepared for the demo.
- **Latency:** dashboard updates should feel "live" — target under 2 seconds from a simulated tick to UI update.

---

## 6. Data Sources

| Source | Used By | Notes |
|---|---|---|
| Open Power System Data — Household Data package | Forecasting Agent, Prosumer Agent, Trading Agent | Real data, 11 households, 15-min resolution, southern Germany — use 4-6 for hackathon scope |
| Open Power System Data — Time Series package | Optimization Agent, pricing benchmark | Germany day-ahead price + national load, used as macro price/stress backdrop |
| Weather API (e.g. Open-Meteo, free tier) | Forecasting Agent | Only if time allows — OPSD's own irradiance-correlated generation data may be sufficient without a live weather call |

---

## 7. Tech Stack

| Component | Choice | Why |
|---|---|---|
| Backend | Python + FastAPI | Fast to stand up REST + WebSocket; strong data/ML library support |
| Agent orchestration | LangGraph or a thin custom function-calling wrapper | LangGraph if team has familiarity; otherwise a simpler direct function-calling loop is lower-risk |
| Deterministic models | pandas, scikit-learn/XGBoost (optional), simple auction algorithm in pure Python | Seasonal-naive forecasting as default; XGBoost only as stretch |
| LLM calls | Claude/OpenAI with structured/function-calling output | Constrain all reasoning-agent outputs to JSON schemas for reliability |
| Database | SQLite | Zero-setup for a hackathon build |
| Frontend | Next.js + React, WebSocket for live updates, a charting library (recharts) | Team likely already fluent; fast iteration |
| Blockchain layer (stretch) | Hash-chained SQLite rows (simulated ledger) | Preserves the "immutable/auditable" demo property without real chain infra risk |

---

## 8. Build Phasing (24-Hour Plan, Blockchain Last)

This condenses the detailed hour-by-hour plan into phases; see the earlier GridMesh 24-hour execution plan for the full breakdown. The phase order below is the key structural decision reflecting your instruction to build blockchain last.

| Phase | Hours | Contents |
|---|---|---|
| **Phase 1 — Foundation** | 0–9 | Data replay pipeline; Forecasting Agent; Trading & Negotiation Agent's deterministic clearing algorithm; Grid Health Agent's stress detection; basic dashboard shell |
| **Phase 2 — Agentic Core** | 9–17 | Prosumer Agents (LLM-driven decisions); Optimization Agent's dispatch logic; Regulation & Compliance Agent's audit/rule-checking; agent-to-agent negotiation for edge cases; full dashboard integration with live decision log |
| **Phase 3 — Freeze & Harden** | 18–20 | Hard feature freeze at Hour 18; bug fixes only; stats/reports panel |
| **Phase 4 — Blockchain Layer (if ahead of schedule)** | 20–22 | Hash-chained ledger replacing the plain trade log; simple pseudonymous ID scheme; basic smart-contract simulation; carbon credit counter — **only attempted here, and only if Phases 1-3 are fully working and stable** |
| **Phase 5 — Pitch & Rehearsal** | 22–24 | Demo script, rehearsal, backup video recording |

**Rationale for blockchain-last ordering:** the blockchain layer adds no functional capability the judges can't already see from the core agent system (trading, negotiation, transparency, compliance) — it adds *demonstrable auditability*, which is valuable but additive, not foundational. Building it last means it never threatens the core agentic-AI story if time runs short, while still being ready to show as a "we didn't just talk about transparency, here's the immutable ledger" closing beat if the team gets there.

---

## 9. Demo Script (Aim for 3-4 Minutes)

| Time | What's Shown | What's Said |
|---|---|---|
| 0:00-0:30 | Dashboard live, 4-6 participants' forecasts ticking | "These are real households from a real energy dataset — GridMesh is watching their generation and demand live." |
| 0:30-1:15 | A trade clears; Prosumer Agent's reasoning shown in decision log | "Each household has its own agent, deciding whether to sell, store, or buy — this one just decided to sell its surplus because its battery reserve preference was already met." |
| 1:15-2:00 | Grid stress event fires; Grid Health + Optimization agents respond | "When demand spikes, our Grid Health Agent flags it, and the Optimization Agent reschedules flexible loads — this is autonomous grid stress response, not a static alert." |
| 2:00-2:30 | Regulation & Compliance Agent flags/audits a trade | "Every trade is checked for fairness and compliance automatically — full transparency, no manual audit needed." |
| 2:30-3:00 | *(If Phase 4 complete)* Blockchain ledger view, carbon credits | "And underneath it all, every trade is recorded on an immutable ledger with tokenized sustainability credits — transparency you can verify, not just trust." |
| 3:00-3:30 | Stats/impact panel + closing line | "Built on real household data — this is a working prototype of the coordination layer that neighborhoods don't have today." |

*Note: the 2:30-3:00 blockchain beat is explicitly optional in the script — if Phase 4 wasn't reached, skip straight to the closing line. Never demo something broken; a confident "and this is designed to extend into a blockchain settlement layer, which we scoped for a later phase" is a stronger answer than a shaky live blockchain demo.*

---

## 10. Success Metrics (What "Working" Means for the Demo)
- Number of real trades cleared during the live demo run (target: at least 2-3 visible clears)
- At least 1 grid-stress event correctly detected and responded to live
- At least 1 compliance flag correctly raised
- Every autonomous decision shown has an accompanying plain-language explanation
- Dashboard runs the full demo script twice without a crash in final rehearsal (Hour 20 checkpoint)

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM latency/non-determinism during live demo | Structured JSON outputs via function-calling; cached fallback responses for the scripted demo path |
| Six-agent system has too much integration surface for 24 hours | Phase 1 (deterministic core) must work standalone before any LLM agent is wired in; cut Should-Have items (4.2) before touching Must-Have (4.1) |
| Blockchain layer eats time meant for the core system | Explicitly scheduled last (Phase 4) and only attempted if Phases 1-3 are complete and stable — see Section 8 |
| Dashboard complexity (6 agents' worth of state) overwhelms the UI in the time available | Prioritize the decision-log transcript view over a fully polished multi-panel dashboard — reasoning visibility matters more than visual polish for the Agentic AI Implementation criterion |
| No live venue internet for LLM calls | Confirm hotspot/backup connectivity specifically for LLM-dependent agents; have a fully pre-recorded backup demo video |

---

## 12. Open Questions for the Team
- Confirm final team size/role split against Section 8's phase structure (who owns which agent).
- Decide now whether LangGraph/AutoGen is worth the setup overhead vs. a simpler custom orchestration loop, given the team's familiarity level — this affects Phase 1-2 timeline directly.
- Decide the fallback plan if Phase 4 (blockchain) doesn't get reached: is "designed for, shown in architecture diagram, not live-demoed" an acceptable answer for your team in Q&A? (Recommended: yes — see Section 9 note.)
