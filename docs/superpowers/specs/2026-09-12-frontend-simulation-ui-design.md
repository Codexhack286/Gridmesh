# GridMesh Frontend Redesign — simulation.html Port

**Date:** 2026-09-12
**Status:** Approved (design walked through section-by-section with user)
**Source of truth for visuals:** `simulation.html` (repo root)
**Constraint:** zero backend changes; 55/55 backend tests stay green.

## 1. Goal & Decisions

Rebuild the Next.js dashboard as the single-screen "GridMesh Control Center"
shown in `simulation.html`, driven entirely by real backend data.

Locked decisions from brainstorming:

- **Approach A — React component port.** Mockup rebuilt as typed React
  components; not a static-template hydration and not a re-skin.
- **Replace `app/page.tsx`** entirely (no new route; old tabbed dashboard is
  superseded).
- **All data live from backend APIs** (`/tick`, `/trades`, `/api/reports`,
  `/api/blockchain/*`, `/api/scenario/*`, `/api/quant/status`). No embedded
  JS simulation logic, no scripted numbers.
- **Full feature scope:** header + scenario bar + 3-column main grid +
  blockchain banner + node inspector + telemetry chart.
- **Scenario bar uses the 5 real rogue-bid kinds** (predatory_price,
  bulk_dump, self_trade, collusion, feeder_overload) + a visual-only
  "Normal" button. The mockup's solar_peak/ev_surge/blackout buttons do not
  exist in the backend and are dropped.
- **Pause/Resume runs an auto-tick loop** (POST /tick every ~4s). Reset
  clears the violation log (`DELETE /api/scenario/violations`) and refetches
  panels — the backend has no clock/ledger reset endpoint; tooltip says so.
- **Light theme as in the mockup** (white cards, slate text, sky-blue brand),
  replacing the current dark theme.
- **Self-contained deps:** `chart.js` via npm, fonts self-hosted via
  `next/font`, icons as inline SVG components. No CDN at runtime.

## 2. Architecture

```
frontend/
├── app/
│   ├── layout.tsx        # Inter + JetBrains Mono via next/font (self-hosted)
│   ├── page.tsx          # replaced — composes panels, owns auto-tick loop
│   └── globals.css       # light-theme tokens from simulation.html :root
├── components/
│   ├── Header.tsx           # brand, sim clock, status pill, Pause/Resume, Reset
│   ├── ScenarioBar.tsx      # Normal + 5 rogue-bid injection buttons
│   ├── SynopticPanel.tsx   # KPI ribbon + SVG topology + inspector (Col 1)
│   ├── OrderbookPanel.tsx  # orderbook, benchmarks, trade ticker (Col 2)
│   ├── AgentStreamPanel.tsx # decision-log transcript stream (Col 3)
│   ├── BlockchainBanner.tsx # collapsible hash-chain blocks (bottom)
│   ├── TelemetryChart.tsx  # Chart.js line chart, dynamic ssr:false
│   └── icons.tsx           # ~20 inline SVG icons (replaces Phosphor CDN)
├── hooks/
│   ├── useGridStream.ts   # extended: tickHistory[], auto-tick support
│   ├── useBlockchain.ts   # unchanged
│   ├── useQuant.ts        # unchanged
│   └── useViolations.ts   # NEW — GET /api/scenario/violations
└── lib/api.ts            # + getViolations(), clearViolations()
```

New dependency: `chart.js` (npm). `recharts` no longer used by new code.

Deleted on completion (Step 9 of rollout): `Topology.tsx`, `ForecastChart.tsx`,
`TradeLedger.tsx`, `DecisionLog.tsx`, `StressBanner.tsx`, `CompliancePanel.tsx`,
`QuantPanel.tsx`, `components/topology.css` dark-theme styles. Only `page.tsx`
imports these (verified by grep).

## 3. Data Mapping (fabrication rule: every number traces to a backend field)

### Header
- Sim clock: `data.tick` → `tickClock(tick)` + tick number (96×15-min day).
- Quant status (`useQuant`, from `/api/quant/status`): small monospace badge
  next to the status pill showing the live forecast model (e.g. `ML: live`) —
  replaces the deleted QuantPanel.
- Status pill: `data.stress` agg < threshold → "GRID NORMAL (STABLE)" green;
  agg ≥ threshold → "GRID STRESS (X kW)" red; backend unreachable → "OFFLINE"
  amber.
- Pause/Resume → interval on/off; Reset → clear violations + refetch.

### Scenario Bar
- Normal: visual-only default.
- 5 rogue bids → `POST /api/scenario/rogue_bid {kind}` (existing `inject()`).
  Response violations prepend regulation cards to the Agent Stream with real
  audit rationales; violation badge count in header. Buttons stay disabled
  until response; injected button stays highlighted until next tick or Normal.

### Column 1 — Synoptic Panel
- KPI 1 Total Solar Gen: `Σ forecasts[].predicted_gen_kw`.
- KPI 2 Feeder Demand: `Σ forecasts[].predicted_load_kw`.
- KPI 3 Transformer Load: `agg / threshold × 100` (real stress ratio; no fake
  100 kVA rating).
- KPI 4 P2P Volume: `reports.community.total_kwh_traded` + avg price.
- SVG topology: 5 participants (solar_home, household, commercial,
  ev_station, battery_site) at fixed mockup positions; node metrics from
  `decisions[]` (action, qty, SOC); flow-line class from action
  (sell→active-solar, buy/charge→active-p2p, discharge→active-bess).
- P2P Hub circle: `p2p_avg_price_usd` converted to ¢/kWh.
- Node inspector (click): participant policy = `preference_applied`, gen/load
  from forecasts, net = gen − load, SOC from decisions.
- Telemetry chart: `tickHistory[]` (appended per tick) — Σ gen and Σ load
  lines, last ~20 ticks. Chart.js, dynamic import `ssr: false`.

### Column 2 — Orderbook Panel
- ASK rows = current `decisions[]` where `action=sell`; BID rows where
  `action=buy` (participant, qty kWh, price = clearing 25.5¢/kWh).
- Benchmarks: grid retail `grid_price_reference_usd`, P2P `p2p_avg_price_usd`.
  Mockup's feed-in tariff is dropped (no backend field).
- Trade ticker: current tick `trades[]` + history `GET /trades`; savings per
  trade = `(grid − p2p price) × qty`.
- Footer: CO₂ avoided `co2_avoided_kg`, community savings
  `financial_savings_usd`. Renewable % dropped (not tracked).

### Column 3 — Agent Stream
- `decision_log[]` per tick: agent → tag color (forecasting green, prosumer
  purple, trading blue, grid_health red, optimization amber, regulation
  indigo), rationale text, tick timestamp. Newest first, cap 30 cards.
- Injected audits appended as regulation entries.

### Blockchain Banner
- `useBlockchain().chain` → block cards (`block_index`, truncated hashes,
  payload = trade/audit counts). Latest highlighted; banner header shows
  latest block number.
- Verify button (existing `verify()`) — small addition beyond mockup,
  approved.

## 4. Interaction & Edge Cases

- Mount starts paused; empty states prompt "Start simulation" — no fake data.
- Resume: 4s interval POST /tick. In-flight guard: skip firing while a
  previous request is unresolved (live LLM can exceed 4s).
- Tick failure (non-2xx/network): auto-pause + amber OFFLINE pill; manual
  resume only. Backend authoritative.
- Injection: whole bar disabled during request; response summary prepends
  regulation card(s) with real rationales.
- Node inspector: click-to-select, panel `pointer-events: none`, data from
  current tick maps; "awaiting first tick" before first tick.
- Degraded states: no tick → "—" KPIs, dim nodes; backend down → last good
  data kept, OFFLINE pill; no trades → orderbook still shows open bids/asks;
  empty chain → "Latest Block: #—", stream hidden.
- Accessibility: inline-SVG icons `aria-hidden`, focusable buttons,
  `aria-pressed` on scenario buttons.
- Caps: transcripts 30, ticker 12, blocks 10 displayed.
- Responsive: < ~1200px columns stack vertically; scenario bar wraps.

## 5. Testing & Verification

Automated gates:
1. `npm run build` (frontend; doubles as the typecheck gate — no separate
   tsc/lint scripts exist).
2. `uv run pytest` backend — 55/55 green (proves "don't break backend").

Live smoke checklist (both servers, live keys):
- [ ] Loads, light theme, no console errors
- [ ] Ticks advance ~4s; clock/KPIs/topology/orderbook/stream/chart update
- [ ] Pause/Resume; no overlapping ticks under slow LLM
- [ ] Each rogue-bid button → regulation card + violation count + correct rule
- [ ] Node click → inspector live values
- [ ] Banner expand/collapse; blocks accumulate; Verify reports valid
- [ ] Backend killed → OFFLINE pill, last data kept; recover on restart
- [ ] Side-by-side visual parity vs simulation.html

No new frontend test framework (none exists today; smoke checklist covers the
interactive surface; adding one is a separate follow-up).

## 6. Risks

| Risk | Mitigation |
|---|---|
| Live LLM tick latency > 4s interval | In-flight guard skips overlapping POSTs |
| Groq free-tier rate limits | Auto-pause on failure; backend fallbacks; manual resume |
| Chart.js SSR in Next 14 | Dynamic import `ssr: false` for TelemetryChart only |
| next/font needs network at build time | Build machine online; runtime self-contained; CSS fallback stack |
| Dead imports after deletions | Grep before deleting; only page.tsx imports the old panels |
| $ vs ¢ unit confusion | One formatter: backend $/kWh → UI ¢/kWh, labels explicit |

## 7. Rollout Order (each step compiles before the next)

1. Tokens & fonts: globals.css light theme, layout.tsx fonts, icons.tsx
2. lib/api.ts additions + useViolations hook
3. useGridStream extension (tickHistory, auto-tick support)
4. Header + ScenarioBar
5. SynopticPanel (KPIs + SVG + inspector + TelemetryChart)
6. OrderbookPanel
7. AgentStreamPanel
8. BlockchainBanner
9. Delete superseded components/styles
10. New page.tsx composition
11. Gates: npm run build + uv run pytest (55) + live smoke checklist
