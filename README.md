# GridMesh — Decentralized Energy Intelligence Platform
### Autonomous Multi-Agent P2P Microgrid Trading, Predictive Forecasting & Verifiable Settlement

[![Python 3.14](https://img.shields.io/badge/python-3.14-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Ensemble%20ML-red.svg)](https://xgboost.readthedocs.io/)
[![Tests Passing](https://img.shields.io/badge/tests-60%2F60%20passed-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Executive Summary

**GridMesh** is an industrial-grade, decentralized microgrid intelligence platform designed for peer-to-peer (P2P) clean energy trading, predictive demand balancing, and cryptographic settlement. Built strictly according to the **IEEE 2030.7 Distributed Energy Resource (DER)** microgrid standard and calibrated to the **Central Electricity Regulatory Commission (CERC) Open Access** framework, GridMesh coordinates autonomous software agents that represent residential solar homes, commercial arrays, community battery systems (BESS), and electric vehicle (EV) charging stations.

Every 15 minutes, autonomous software agents predict local solar generation and consumption, negotiate bilateral energy transfers via a Continuous Double Auction, protect physical distribution transformers from thermal overload, enforce statutory regulatory collars, and seal all financial transactions into an immutable SHA-256 Merkle-linked blockchain ledger.

---

## The Core Problem

Conventional distribution grids operate as rigid, centralized, one-way pipelines. As distributed rooftop solar and high-power EV charging surge across Indian urban centers, two systemic failures emerge:

1. **The Prosumer Economic Disparity:**
   State DISCOMs purchase surplus rooftop solar at minimal net-metering buyback rates (**₹2.60/kWh**), while reselling that same energy to adjacent residential neighbors at full peak tariffs (**₹7.80 to ₹8.50/kWh**). Prosumers are disincentivized from expanding solar capacity, while non-solar consumers face escalating monthly utility bills.
2. **Distribution Transformer (DT) Overload & Thermal Burnout:**
   Simultaneous evening residential air conditioning and uncoordinated EV fleet charging cause severe aggregate load spikes. Distribution transformers routinely breach their physical thermal limits (e.g. 6.0 kW per local low-voltage cluster), causing frequent local feeder brownouts, voltage instability, and catastrophic transformer burnouts.
3. **The 15-Minute Human Impossibility:**
   Power systems balance dynamically every 15 minutes (96 operational dispatch intervals per 24-hour day). Expecting human prosumers to log in 96 times a day to manually click "Buy" or "Sell" 0.35 kWh of solar power is physically impossible. **Autonomous multi-agent systems are the only viable technical solution.**

---

## Key Features & Technological Innovations

### 1. Autonomous 15-Minute Dispatch Engine
* Simulates 96 operational intervals per 24-hour day in continuous **12-hour AM/PM Indian Standard Time (IST)**.
* Hands-free autonomous execution: prosumers configure high-level economic preferences once; autonomous software agents manage bidding, matching, and physical battery dispatch 24/7.
* Integrated single-step forward (`+15m`), auto-run (4-second real-time streaming), and clean clock reset endpoints.

### 2. Quant ML Forecaster (Voting Ensemble)
* **Architecture:** Trained `VotingRegressor` ensemble combining regularized **Random Forest** (100 estimators, max depth 12) and **XGBoost** (100 rounds, learning rate 0.08, max depth 5, subsample 0.8).
* **Dataset:** 14,400 empirical observations across 30 days derived from high-resolution smart meter telemetry.
* **Feature Engineering:**
  * Autoregressive lags: `lag1_load` and `lag1_gen` (rolling historical meter memory).
  * Cyclical trigonometric embeddings: $\sin(2\pi \cdot \text{tick}/96)$ and $\cos(2\pi \cdot \text{tick}/96)$ eliminating midnight boundary discontinuities.
  * Temporal & calendar features: `hour`, `minute`, `day_of_week`, `is_weekend`, `tick_of_day`.
  * Node entity one-hot encodings.
* **Evaluation:** Strict temporal out-of-sample split (Days 1–23 train, Days 24–30 test chronologically to prevent lookahead data leakage).
* **Validated Performance:**
  * **Solar Generation:** $R^2 = 95.62\%$, $\text{MAE} = 0.222\text{ kW}$
  * **Demand Load:** $R^2 = 70.98\%$, $\text{MAE} = 0.098\text{ kW}$

### 3. Multi-Agent Intelligence Hierarchy (LangGraph)
A cooperating multi-agent pipeline executing sequentially within each 15-minute dispatch tick:
1. **Forecasting Agent:** Computes 15-minute ahead generation and demand predictions for all microgrid nodes.
2. **Grid Health Agent:** Computes aggregate feeder draw against the distribution transformer safety threshold (6.0 kW).
3. **Optimization Agent:** Detects stress and issues automated BESS battery discharge overrides to shave peak loads before market formation.
4. **Prosumer Agents (×5):** Evaluates net energy balance, battery state-of-charge (SOC %), and natural language preferences to formulate market orders.
5. **Trading Agent:** Aggregates bids and asks and executes a Continuous Double Auction.
6. **Regulation Agent:** Audits proposed trades against CERC grid-code rules prior to ledger entry.

### 4. Continuous Double Auction Market Clearing
* Descending buyer bid queue matched against ascending seller ask queue.
* Pareto-optimal clearing price calculated at the supply-demand midpoint:
  $$P_{\text{clear}} = \frac{P_{\text{bid}} + P_{\text{ask}}}{2}$$
* **Economic Impact:**
  * Benchmark P2P Clearing Rate: **₹6.20/kWh** vs. DISCOM Retail **₹7.80/kWh**.
  * **Consumers Save:** **~20.5% to 22.0%** per unit of electricity purchased.
  * **Prosumers Earn:** **+138%** higher revenue compared to DISCOM net-metering feed-in buyback (₹2.60/kWh).

### 5. CERC Regulatory Compliance Shield
Automated sub-5ms policy enforcement engine auditing every trade against statutory grid rules:
* **Rule R-01 (Price Collar Ceiling):** Rejects any trade cleared above ₹9.00/kWh to eliminate predatory surge pricing.
* **Rule R-02 (Volume Quota Cap):** Limits single transactions to 10.0 kWh per trade to prevent capacity monopolization.
* **Rule R-03 (Self-Trade Guard):** Blocks wash trading where the buyer and seller identities are identical.
* **Rule R-04 (Anti-Collusion Floor):** Flags non-competitive transfers below generation cost (₹4.00/kWh).
* **Rule R-05 (Distribution Transformer Limit):** Halts transactions that would physically push aggregate transformer loading beyond 8.0 kW.

### 6. Verifiable SHA-256 Merkle Blockchain Ledger
* Every settled trade and regulatory compliance receipt is appended to an immutable SQLite-backed cryptographic hash chain.
* Block hash pointer:
  $$\text{Block\_Hash} = \text{SHA256}(\text{Index} + \text{Prev\_Hash} + \text{Timestamp} + \text{Payload})$$
* **Live Tamper Verification:** Interactive verification engine recalculates the entire Merkle chain from Block #0 to the tip. If any database field is tampered with, the exact compromised block is flagged in red with zero downtime.

### 7. Interactive What-If Decision Sandbox
* A dedicated evaluation sandbox enabling operators and evaluators to manually test agent decision-making under custom boundary conditions without altering the main 15-minute simulation clock or blockchain ledger.
* **Live Parameters:** Solar PV Generation (0–12 kW), Demand Load (0–12 kW), Battery SOC (0–100%), P2P Price (₹3–13/kWh), and Feeder Threshold.
* **5 Quick-Select Presets:**
  * *Noon Solar Export:* High solar (6.8 kW) + full battery (92%) $\rightarrow$ Action: `SELL 1.40 kWh` P2P Ask.
  * *Battery Self-Storage:* Solar surplus (4.5 kW) with low battery (35% SOC) $\rightarrow$ Action: `CHARGE 0.88 kWh` (self-consumption prioritized).
  * *Evening Deficit:* Zero solar + high load (3.6 kW) $\rightarrow$ Action: `BUY 0.90 kWh` P2P Bid.
  * *Feeder Overload (BESS):* Surge load exceeds 6.0 kW $\rightarrow$ Triggers automated BESS peak-shaving override.
  * *CERC Price Collar Spike:* Price at ₹11.50/kWh $\rightarrow$ CERC Regulatory Guard flags Rule R-01 violation, blocking trade.

### 8. Indian Feeder Calibration & Environmental Baseline
* Calibrated to Indian tropical Global Horizontal Irradiance (5.5–6.5 kWh/m²/day) with IST midday solar peak (11:30–13:30).
* Scaled to Indian distribution feeder dynamics: commercial afternoon cooling loads and pronounced evening domestic surges (18:00–22:00 IST).
* Decarbonization quantified using the **Central Electricity Authority (CEA) Baseline Database v19** emission factor: **0.716 kg CO₂/kWh** avoided per unit of local renewable power traded.

---

## System Architecture

```
[ PHYSICAL / EDGE LAYER ]
  Smart Meters (DLMS/COSEM) • Solar Inverters (Modbus RTU) • Battery BMS (CAN/RS485)
                                    │ (Encrypted MQTT / gRPC)
                                    ▼
[ LAYER 1: Empirical Ingestion & Telemetry ]
  14,400 OPSD Smart Meter Records • Indian GHI & IST Calibrated • 96 Ticks/Day
                                    │
                                    ▼
[ LAYER 2: Quant ML Forecaster ]
  Voting Ensemble: Random Forest + XGBoost • Cyclical sin/cos Embeddings • Lags
  Solar R² = 95.62% • Demand R² = 70.98%
                                    │
                                    ▼
[ LAYER 3: Multi-Agent Intelligence Layer ]
  Forecasting Agent ──► Grid Health Agent (<6.0 kW DT limit)
                                │
                                ▼
                       Optimization Agent (BESS Peak Shaving)
                                │
                                ▼
                       Prosumer Agents (×5 Personas: Buy/Sell/Store)
                                    │
                                    ▼
[ LAYER 4: Continuous Double Auction ]
  Bid Queue vs. Ask Queue ──► Midpoint Clearing (₹6.20/kWh vs. DISCOM ₹7.80/kWh)
                                    │
                                    ▼
[ LAYER 5: Compliance & Regulatory Shield ]
  Sub-5ms Audit of CERC Rules: R-01 (Price), R-02 (Volume), R-03 (Wash), R-04 (Floor), R-05 (DT)
                                    │
                                    ▼
[ LAYER 6: Verifiable Settlement Ledger ]
  Immutable SHA-256 Merkle Chain • Cryptographic Receipts • SQLite Storage
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
[ LAYER 7: What-If Sandbox ]                            [ LAYER 8: Operator Console ]
  Stateless Parameter Injection & Evaluation              Next.js 16 Executive Light-Mode Dashboard
  Sliders • 5 Presets • Live Decision Tree                Synoptic Diagram • Orderbook • Blockchain Audit
```

---

## Production Telemetry Pipeline (Zero Manual Uploads)

A common misconception is that prosumers manually upload spreadsheets or click buttons every 15 minutes. In an industrial microgrid, data acquisition is **100% autonomous**:

1. **The On-Premise IoT Edge Gateway:** Each participant facility has a compact industrial controller (e.g. Raspberry Pi CM4 or ESP32-S3 edge node) installed beside the main electrical panel.
2. **Standard Industrial Protocols:**
   * **Smart Meters:** Communicates bidirectional kWh imports and exports via **DLMS / COSEM (IS 16444 / IS 15959)** over cellular 4G/NB-IoT.
   * **Rooftop Solar Inverters:** Queries generation and MPPT power via **Modbus RTU / Modbus TCP** (SunSpec standard across SolarEdge, Sungrow, Enphase, Havells).
   * **Battery Management Systems (BMS):** Reads state-of-charge (SOC %) and thermal limits via **CAN bus / RS-485**.
3. **Automated 15-Minute Streaming:** At each interval boundary, the gateway securely packages readings and streams them via **MQTT over TLS** to the agent cluster.
4. **Prosumer Experience:** Prosumers configure their economic policy **once** on their smartphone (e.g. *"Keep 30% battery reserve; sell surplus when battery > 80%"*). The software agents handle all 96 daily dispatch cycles automatically.

---

## Microgrid Participant Personas

| Node ID | Entity Name | Type | Assets | Battery Reserve Policy |
| :--- | :--- | :--- | :--- | :--- |
| `solar_home` | Solar Home A | Prosumer | 5.0 kW Solar PV, 8 kWh BESS | Keep 30% reserve; sell surplus when SOC > 80% |
| `household` | Residential Cluster B | Pure Consumer | Baseload & AC Cooling, 4 kWh BESS | Pure consumer; buy P2P power to avoid DISCOM peak |
| `commercial` | Commercial Solar C | Large Prosumer | 15.0 kW Solar Array, 14 kWh BESS | Maximize export revenue during daylight business hours |
| `ev_station` | EV Charging Hub D | Fleet Consumer | Fast DC Chargers, 30 kWh Buffer | Flexible fleet charging; throttles during feeder stress |
| `battery_site` | Community BESS E | Storage Node | 10 kWh Community Storage | Absorbs midday solar overgeneration; discharges during peak |

---

## Repository Structure

```
Gridmesh/
├── backend/                        # FastAPI Multi-Agent Backend
│   ├── app/
│   │   ├── agents/                 # LangGraph Multi-Agent Pipeline
│   │   │   ├── forecasting.py      # Ensemble ML Forecaster (RF + XGBoost)
│   │   │   ├── grid_health.py      # Feeder Stress & Transformer Capacity Monitor
│   │   │   ├── optimization.py     # BESS Peak Shaving & Load Shifting
│   │   │   ├── prosumer.py         # 5 Prosumer Trading Agents (Rule/LLM Tiers)
│   │   │   ├── trading.py          # Continuous Double Auction Market Clearing
│   │   │   ├── regulation.py       # CERC/SERC Compliance Engine (Rules R-01–R-05)
│   │   │   └── graph.py            # LangGraph Pipeline Coordinator
│   │   ├── api/
│   │   │   ├── routes/             # REST Endpoints
│   │   │   │   ├── ticks.py        # POST /tick, POST /tick/reset (Sim Clock)
│   │   │   │   ├── simulate.py     # POST /api/simulate/decision (What-If Sandbox)
│   │   │   │   ├── quant.py        # GET /api/quant/status (Model Health)
│   │   │   │   ├── blockchain.py   # GET /chain, POST /verify, POST /tamper
│   │   │   │   ├── scenarios.py    # POST /api/scenario/rogue_bid (CERC Violations)
│   │   │   │   ├── reports.py      # GET /api/reports (Sustainability & Savings)
│   │   │   │   └── trades.py       # GET /trades (Live & Historic Ticker)
│   │   │   ├── violation_log.py    # Live Statutory Audit Log
│   │   │   └── websockets.py       # Real-Time WebSocket Telemetry Stream
│   │   ├── core/                   # Schemas, SimClock, Config
│   │   ├── data/                   # OPSD Data Loaders & Replay Engines
│   │   ├── ledger/                 # SQLite SHA-256 Merkle Blockchain
│   │   └── llm/                    # Groq Cloud / NVIDIA NIM Client with Fallback
│   ├── tests/                      # Automated Test Suite (60 Passing Tests)
│   │   ├── test_simulate.py        # What-If Decision Sandbox Tests
│   │   ├── test_forecasting.py     # ML Forecast Evaluation Tests
│   │   ├── test_regulation.py      # CERC R-01–R-05 Compliance Tests
│   │   ├── test_sqlite_ledger.py   # SHA-256 Hash Chain & Tamper Tests
│   │   ├── test_clearing.py        # Double Auction Midpoint Tests
│   │   ├── test_optimization.py    # BESS Peak-Shaving Dispatch Tests
│   │   ├── test_prosumer_battery.py# Battery Reserve & SOC Priority Tests
│   │   ├── test_clock.py           # 15-Minute Clock Tests
│   │   └── test_tick.py            # End-to-End Tick Pipeline Tests
│   └── main.py                     # FastAPI Application Entrypoint
│
├── frontend/                       # Next.js 16 (Turbopack) Operator Dashboard
│   ├── app/
│   │   ├── layout.tsx              # Root Layout
│   │   ├── page.tsx                # Tab Orchestrator & KPI State Management
│   │   └── globals.css             # Base Tokens
│   ├── components/
│   │   ├── Header.tsx              # Executive 2-Tier Card with 7 Symmetrical Tabs
│   │   ├── SynopticPanel.tsx       # Live SVG Feeder Topology with Current Flows
│   │   ├── OrderbookPanel.tsx      # Double Auction Bid/Ask Queues & Cleared Trades
│   │   ├── AgentStreamPanel.tsx    # Live Agent Reasoning & Natural Language Log
│   │   ├── BlockchainBanner.tsx    # Cryptographic Chain Explorer & Tamper UI
│   │   ├── QuantPanel.tsx          # ML Model Specs, R² Metrics & Variance Table
│   │   ├── WhatIfSimulator.tsx     # Interactive Parameter Sandbox (Sliders & 5 Presets)
│   │   ├── CompliancePanel.tsx     # CERC Rules Directory & Tamper Audit Matrix
│   │   ├── SystemDesignFlowchart.tsx # 8-Layer Interactive System Architecture
│   │   ├── PlatformGuide.tsx       # Operator Guide, IoT Architecture FAQ & Specs
│   │   ├── DatasetCalibrationBanner.tsx # Indian Feeder Conversion Matrix
│   │   ├── ScenarioBar.tsx         # Rogue Bid Injection Suite
│   │   └── dashboard.css           # 1280px Constant-Width Responsive Design System
│   └── lib/                        # API Client, IST AM/PM Time Formatters, Utils
│
├── data/                           # Data Assets & Training Pipelines
│   ├── train_forecaster.py         # XGBoost + Random Forest Training Script
│   ├── forecaster_ensemble.pkl     # Trained Ensemble Model Bundle (15.9 MB)
│   ├── household_multi_day.csv     # 14,400 Clean 15-Minute Microgrid Observations
│   ├── household_15min.csv         # 480-Row Demonstration Day Slice
│   └── fallbacks/                  # Offline Heuristic JSON Fallbacks
│
├── explanation.txt                 # 2.5-Minute Video Pitch & Director's Screenplay
├── pyproject.toml                  # Python Dependencies Managed via uv
└── .env.example                    # Environment Template
```

---

## Getting Started

### Prerequisites
* **Python:** 3.11+ (Python 3.14 fully supported)
* **Package Manager:** `uv` ([Install uv](https://docs.astral.sh/uv/getting-started/installation/))
* **Node.js:** v18.0+ & `npm`

### 1. Backend Setup
```powershell
# Navigate to repository root
cd Gridmesh

# Sync virtual environment and install dependencies
uv sync --extra dev

# Launch backend API server on port 8000
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --app-dir backend
```
The backend will be live at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
In a separate terminal:
```powershell
# Navigate to frontend directory
cd Gridmesh/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

### 3. Environment Configuration (Optional)
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
GridMesh includes offline heuristics and fallback models in `data/fallbacks/`, meaning **no external API keys are required to run the platform**. If you wish to use live cloud LLM reasoning, configure your free **Groq Cloud** key in `.env`:
```bash
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=qwen/qwen3.8-27b
LLM_PROVIDER=groq
```

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/tick` | Advances the 15-min clock, executes LangGraph multi-agent pipeline, and mints a block. |
| `POST` | `/tick/reset` | Resets the simulation clock back to Step #0 (12:00 AM IST Day 1). |
| `GET` | `/trades` | Returns all historic cleared trades from the SQLite ledger. |
| `GET` | `/api/reports` | Returns community sustainability metrics (kWh traded, savings ₹, CO₂ avoided). |
| `GET` | `/api/quant/status` | Returns ML forecaster health, loaded model path, and fallback status. |
| `POST` | `/api/simulate/decision` | **What-If Sandbox:** Statelessly computes agent decision for custom inputs. |
| `GET` | `/api/blockchain/chain` | Retrieves the full SHA-256 Merkle block history. |
| `POST` | `/api/blockchain/verify` | Cryptographically verifies hash pointers across the entire chain. |
| `POST` | `/api/blockchain/tamper` | Simulates an adversarial database attack by modifying trade volume. |
| `POST` | `/api/scenario/rogue_bid` | Injects illegal bids to trigger CERC rules (R-01 to R-05). |

---

## Automated Verification & Test Suite

GridMesh includes an automated test suite verifying every component from battery SOC thresholds to double-auction clearing and cryptographic hash integrity:

```powershell
# Run the complete test suite
uv run pytest
```

### Test Suite Results:
```
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.6.0
collected 60 items

tests/test_clearing.py .                                                 [  1%]
tests/test_clock.py .                                                    [  3%]
tests/test_forecasting.py ...                                            [  8%]
tests/test_ledger.py .                                                   [ 10%]
tests/test_optimization.py ............                                  [ 30%]
tests/test_prosumer_battery.py ............                              [ 50%]
tests/test_regulation.py ...............                                 [ 75%]
tests/test_simulate.py .....                                             [ 83%]
tests/test_sqlite_ledger.py .........                                    [ 98%]
tests/test_tick.py .                                                     [100%]

======================== 60 passed, 1 warning in 7.26s ========================
```

### Frontend Production Build Gate:
```powershell
cd frontend
npm run build
```
* **Status:** Clean production compilation (`exit code 0`, 0 errors, static prerender validated).

---

## 2.5-Minute Video Pitch & Walkthrough

A shot-by-shot video screenplay with exact timing markers, screen actions, and word-for-word voiceover script is available in:
* [`explanation.txt`](file:///c:/Users/rohit/OneDrive/Desktop/bitnbuild/Gridmesh/explanation.txt)

---

## Standards & Regulatory Grounding

* **IEEE 2030.7-2017:** IEEE Standard for the Specification of Microgrid Controllers.
* **CERC (Open Access in Inter-State Transmission) Regulations:** Framework for non-discriminatory bilateral clean energy access.
* **IS 16444 / IS 15959:** Bureau of Indian Standards (BIS) specifications for AC Static Direct Connected Smart Electricity Meters.
* **CEA India CO₂ Baseline Database v19:** Central Electricity Authority standard emission factor ($0.716\text{ kg CO}_2/\text{kWh}$).
* **Open Power System Data (OPSD):** Empirical 15-minute prosumer smart meter observations.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
