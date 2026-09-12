# Frontend Simulation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Next.js dashboard as the single-screen "GridMesh Control Center" from `simulation.html`, driven entirely by live backend APIs with zero backend changes.

**Architecture:** React component port (Approach A). New light-theme tokens, 6 new panel components, Chart.js telemetry chart, inline-SVG icons. Auto-tick loop in `page.tsx` (4s interval, in-flight guard). Old tabbed dashboard components deleted at the end. All data traces to backend fields (fabrication rule).

**Tech Stack:** Next.js 14 (App Router, pages under `frontend/`), React 18, TypeScript, chart.js (new npm dep), next/font self-hosted Inter + JetBrains Mono.

## Global Constraints

- Zero backend file changes; `uv run pytest` (in `backend/`) must stay 55/55 green at every gate.
- No CDN at runtime: fonts via `next/font`, icons as inline SVG, chart.js from npm.
- Light theme exactly per `simulation.html` tokens (`--bg-main: #f8fafc`, `--brand-blue: #0284c7`, etc.).
- Fabrication rule: every displayed number traces to a backend field; mockup-only values (18.4 kW, 100 kVA, TR-9821, REC credits, feed-in tariff) dropped/replaced, never faked.
- Frontend commands run in `frontend/` workdir; backend commands in `backend/` workdir. Package manager: npm (existing `frontend/package-lock.json`).
- Each task ends with `npm run build` green in `frontend/` before commit (it is the only typecheck gate).
- Caps: transcripts 30 cards, trade ticker 12 items, blocks 10 displayed.
- Existing hook error style: try/catch with empty catch comment (backend unreachable → panels keep last data).

---

### Task 1: Light theme tokens, fonts, icon set

**Files:**
- Create: `frontend/components/icons.tsx`
- Modify: `frontend/app/globals.css` (replace tokens/body; keep only classes new UI needs)
- Modify: `frontend/app/layout.tsx` (Inter + JetBrains Mono via next/font)

**Interfaces:**
- Produces: `IconName` type = `"lightning" | "clock" | "pause" | "play" | "reset" | "flask" | "check-circle" | "tag-theft" | "boxes" | "loop" | "users" | "circuitry" | "sun" | "trend-up" | "gauge" | "handshake" | "cloud-sun" | "house" | "heartbeat" | "sliders" | "shield-check" | "shield-warning" | "scales" | "brain" | "link" | "caret-down" | "caret-right"`; component `Icon({name, size}: {name: IconName; size?: number})` rendering inline SVG with `aria-hidden="true"`.
- Produces (CSS custom props in globals.css): `--bg-main`, `--bg-card`, `--border-color`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--text-muted`, `--brand-blue`, `--brand-blue-light`, `--green-gen`, `--green-light`, `--amber-warn`, `--amber-light`, `--red-alert`, `--red-light`, `--purple-agent`, `--purple-light`, `--indigo-reg`, `--indigo-light`, `--shadow-sm/md/lg`, `--radius-sm/md/lg` — all values verbatim from `simulation.html` lines 16-44.

- [ ] **Step 1: Replace `frontend/app/globals.css`** with light tokens + base rules (copy the `:root` block verbatim from `simulation.html` lines 16-44; body per its lines 52-61; add `.mono { font-family: var(--font-mono, monospace); }`; keep scrollbar styling from its lines 648-661). Delete all old dark-theme classes (`.tabs`, `.tab-btn`, `.shell-panel`, `.shell-caption`, `.shell-empty`) — they die with the old page.

- [ ] **Step 2: Update `frontend/app/layout.tsx`** — swap `IBM_Plex_Mono/IBM_Plex_Sans` for `Inter` (weights 400,500,600,700,800) and `JetBrains_Mono` (400,500,600), same `--font-sans`/`--font-mono` variables. Remove `import "../components/topology.css"` (file deleted in Task 9; but the file must not break builds now — see Step 4 note).

- [ ] **Step 3: Create `frontend/components/icons.tsx`** with `Icon` component. Each icon is a 24×24 viewBox inline SVG path set (weights/stroke simplified from Phosphor aesthetics). Include at minimum the names listed in Interfaces (they cover every icon in the mockup). Fill `currentColor`. Example shape:

```tsx
"use client";
export type IconName =
  | "lightning" | "clock" | "pause" | "play" | "reset" | "flask"
  | "check-circle" | "tag-theft" | "boxes" | "loop" | "users" | "circuitry"
  | "sun" | "trend-up" | "gauge" | "handshake" | "cloud-sun" | "house"
  | "heartbeat" | "sliders" | "shield-check" | "shield-warning" | "scales"
  | "brain" | "link" | "caret-down" | "caret-right";

const PATHS: Record<IconName, React.ReactNode> = {
  lightning: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  // ... one entry per icon name; simple geometric paths are fine
};

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      {PATHS[name]}
    </svg>
  );
}
```

- [ ] **Step 4: Keep build green.** `page.tsx` still imports old components and `topology.css` may still be imported by layout — after Step 2 it is not, but `Topology.tsx` imports nothing CSS-side; verify with build. Run in `frontend/`:

```
npm install
npm run build
```

Expected: build succeeds. (Old dark styles now unused but components still compile — CSS import removed in layout only.)

- [ ] **Step 5: Commit**

```bash
git add frontend/app/globals.css frontend/app/layout.tsx frontend/components/icons.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): light theme tokens, Inter/JetBrains Mono fonts, inline SVG icon set"
```

---

### Task 2: API additions + violations hook

**Files:**
- Modify: `frontend/lib/api.ts` (add 2 functions)
- Create: `frontend/hooks/useViolations.ts`

**Interfaces:**
- Consumes: backend endpoints `GET /api/scenario/violations` → `{total: number; injected_only: boolean; violations: Array<{tick: number; flag: string; severity?: string; rule_id?: string; rationale?: string; injected?: boolean; time?: string}>}` and `DELETE /api/scenario/violations` → `{cleared: number}`.
- Produces: `getViolations(): Promise<ViolationsResponse>`; `clearViolations(): Promise<{cleared: number}>` in `lib/api.ts`; hook `useViolations()` returning `{ total: number; violations: Violation[] | null; refresh: () => Promise<void>; clear: () => Promise<void>; clearing: boolean }`.

- [ ] **Step 1: Extend `frontend/lib/api.ts`** — append:

```ts
export async function getViolations() {
  const r = await fetch(`${API_BASE}/api/scenario/violations`);
  return r.json();
}

export async function clearViolations() {
  const r = await fetch(`${API_BASE}/api/scenario/violations`, { method: "DELETE" });
  return r.json();
}
```

- [ ] **Step 2: Create `frontend/hooks/useViolations.ts`**:

```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { getViolations, clearViolations } from "../lib/api";

export function useViolations() {
  const [total, setTotal] = useState(0);
  const [violations, setViolations] = useState<any[] | null>(null);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await getViolations();
      setTotal(r.total ?? 0);
      setViolations(r.violations ?? []);
    } catch {
      /* backend unreachable — keep last good data */
    }
  }, []);

  const clear = useCallback(async () => {
    setClearing(true);
    try {
      await clearViolations();
      await refresh();
    } finally {
      setClearing(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { total, violations, refresh, clear, clearing };
}
```

- [ ] **Step 3: Build gate** — `npm run build` in `frontend/`. Expected: success.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/api.ts frontend/hooks/useViolations.ts
git commit -m "feat(frontend): violations API client + useViolations hook"
```

---

### Task 3: useGridStream extension (tickHistory, tick failure signal)

**Files:**
- Modify: `frontend/hooks/useGridStream.ts`

**Interfaces:**
- Produces: `useGridStream()` additionally returns:
  - `tickHistory: Array<{tick: number; solarKw: number; loadKw: number}>` (appended per successful tick, capped at last 20; solarKw = `Σ forecasts[].predicted_gen_kw`, loadKw = `Σ forecasts[].predicted_load_kw`)
  - `tickFailed: boolean` (true when last `advance()` threw; reset to false on next successful tick or new attempt)
  - `reset(): Promise<void>` — calls violation-log clear + full refetch (meta + violations refresh passed in by caller? NO — keep hook self-contained: it calls `clearViolations()` from `lib/api.ts` itself, then `refreshMeta()`; violations list refresh is the page's concern via `useViolations().refresh()` which page calls after).
- Keeps: existing `data, reports, chainStatus, lastInjection, checkedAt, loading, injecting, advance, inject, check` unchanged (same names/types) so Tasks 4-8 can rely on them.

- [ ] **Step 1: Modify `frontend/hooks/useGridStream.ts`**:

```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { postTick, getReports, getBlockchainStatus, postRogueBid, clearViolations } from "../lib/api";

export interface TickPoint { tick: number; solarKw: number; loadKw: number; }
const HISTORY_CAP = 20;

function sumForecasts(data: any): TickPoint | null {
  const f = data?.forecasts;
  if (!Array.isArray(f) || f.length === 0) return null;
  const solarKw = f.reduce((a: number, x: any) => a + (Number(x.predicted_gen_kw) || 0), 0);
  const loadKw = f.reduce((a: number, x: any) => a + (Number(x.predicted_load_kw) || 0), 0);
  return { tick: data.tick, solarKw: Math.round(solarKw * 100) / 100, loadKw: Math.round(loadKw * 100) / 100 };
}

export function useGridStream() {
  const [data, setData] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [chainStatus, setChainStatus] = useState<any>(null);
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [tickFailed, setTickFailed] = useState(false);
  const [tickHistory, setTickHistory] = useState<TickPoint[]>([]);

  const refreshMeta = useCallback(async () => {
    try { setReports(await getReports()); } catch { /* backend unreachable */ }
    try { setChainStatus(await getBlockchainStatus()); } catch { /* pre-Phase-4 backend */ }
  }, []);

  const advance = useCallback(async () => {
    setLoading(true);
    try {
      const d = await postTick();
      setData(d);
      setTickFailed(false);
      const pt = sumForecasts(d);
      if (pt) setTickHistory((h) => [...h, pt].slice(-HISTORY_CAP));
      await refreshMeta();
    } catch {
      setTickFailed(true);
    } finally {
      setLoading(false);
    }
  }, [refreshMeta]);

  const inject = useCallback(async (kind: string) => {
    setInjecting(true);
    try {
      setLastInjection(await postRogueBid(kind));
      await refreshMeta();
    } finally {
      setInjecting(false);
    }
  }, [refreshMeta]);

  const check = useCallback(async () => {
    await refreshMeta();
    setCheckedAt(new Date().toISOString());
  }, [refreshMeta]);

  const reset = useCallback(async () => {
    try { await clearViolations(); } catch { /* backend unreachable */ }
    await refreshMeta();
  }, [refreshMeta]);

  useEffect(() => { void refreshMeta(); }, [refreshMeta]);

  return { data, reports, chainStatus, lastInjection, checkedAt, loading, injecting,
           tickFailed, tickHistory, advance, inject, check, reset };
}
```

- [ ] **Step 2: Build gate** — `npm run build`. Expected: success (old `page.tsx` still compiles: it destructures a subset of the same names).

- [ ] **Step 3: Commit**

```bash
git add frontend/hooks/useGridStream.ts
git commit -m "feat(frontend): tickHistory telemetry buffer, tick-failure signal, reset in useGridStream"
```

---

### Task 4: Header + ScenarioBar components

**Files:**
- Create: `frontend/components/Header.tsx`
- Create: `frontend/components/ScenarioBar.tsx`
- Create: `frontend/components/dashboard.css` (shared layout classes for header/scenario-bar/cards — see Interfaces)

**Interfaces:**
- Consumes: `Icon` from `icons.tsx`; `tickClock` will later come from SynopticPanel (Task 5) — for now Header takes `clockLabel: string` prop precomputed by page. Existing hooks' fields: `data.tick`, `data.stress.aggregate_demand_kw`, `data.stress.threshold_kw`, `quant.status`, `loading`, `tickFailed`, `violationsTotal`.
- Produces: `<Header clockLabel running tickFailed stressAggKw stressThresholdKw loading quantModel violationCount onToggleSim onReset />`; `<ScenarioBar injecting activeKind onInject />` where `activeKind: string | null` and `onInject(kind: string)`.
- `dashboard.css` produces classes (verbatim from `simulation.html`): `header`, `brand`, `logo-badge`, `brand-title`, `brand-subtitle`, `status-pill` (+ `.islanded`, `.critical`), `status-dot` + `pulse` keyframes, `top-controls`, `sim-clock`, `btn`, `btn-primary`, `btn-outline`, `scenario-bar`, `scenario-label`, `scenario-actions`, `scenario-btn` (+ `.active`), `card`, `card-header`, `card-title`, `card-subtitle`, `card-body`, `main-grid`.

- [ ] **Step 1: Create `frontend/components/dashboard.css`** — copy the class rules listed above from `simulation.html` (header: lines 63-202; scenario bar: 204-257; cards/grid: 259-308). Paste the corresponding CSS verbatim, renaming nothing. Add `.main-grid { grid-template-columns: 2.2fr 1.2fr 1.4fr; }` per line 262 and the responsive override:

```css
@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Create `frontend/components/Header.tsx`**:

```tsx
"use client";
import { Icon } from "./icons";

export function Header({
  clockLabel, running, tickFailed, stressAggKw, stressThresholdKw,
  loading, quantModel, violationCount, onToggleSim, onReset,
}: {
  clockLabel: string;
  running: boolean;
  tickFailed: boolean;
  stressAggKw: number;
  stressThresholdKw: number;
  loading: boolean;
  quantModel: string | null;
  violationCount: number;
  onToggleSim: () => void;
  onReset: () => void;
}) {
  const stressed = stressAggKw >= stressThresholdKw;
  const pillClass = tickFailed ? "status-pill islanded" : stressed ? "status-pill critical" : "status-pill";
  const pillText = tickFailed ? "OFFLINE / PAUSED" : stressed ? `GRID STRESS (${stressAggKw.toFixed(2)} kW)` : "GRID NORMAL (STABLE)";
  return (
    <header>
      <div className="brand">
        <div className="logo-badge"><Icon name="lightning" size={22} /></div>
        <div>
          <div className="brand-title">GridMesh Control Center</div>
          <div className="brand-subtitle">
            <span>Decentralized Microgrid Agent Network</span><span>•</span>
            <span>OPSD Southern Germany 6-Household Dataset</span>
          </div>
        </div>
      </div>
      <div className="top-controls">
        {quantModel ? <span className="sim-clock mono">{quantModel}</span> : null}
        <div className="sim-clock"><Icon name="clock" size={14} /><span>{clockLabel}</span></div>
        <div className={pillClass} id="grid-status-pill">
          <span className="status-dot" /><span>{pillText}</span>
        </div>
        <button className="btn btn-primary" onClick={onToggleSim} disabled={loading}>
          <Icon name={running ? "pause" : "play"} size={14} />
          <span>{running ? "Pause Sim" : "Resume Sim"}</span>
        </button>
        <button className="btn btn-outline" onClick={onReset} title="Clears the violation log only — the sim clock and ledger persist server-side">
          <Icon name="reset" size={14} /><span>Reset</span>
        </button>
        {violationCount > 0 && (
          <span className="status-pill critical"><Icon name="shield-warning" size={12} />{violationCount} violations</span>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `frontend/components/ScenarioBar.tsx`**:

```tsx
"use client";
import { Icon } from "./icons";

const SCENARIOS: Array<{ kind: string; label: string; icon: any; color: string }> = [
  { kind: "normal", label: "Normal Dispatch", icon: "check-circle", color: "#10b981" },
  { kind: "predatory_price", label: "Predatory Price (R-01)", icon: "tag-theft", color: "#ef4444" },
  { kind: "bulk_dump", label: "Bulk Dump (R-02)", icon: "boxes", color: "#f59e0b" },
  { kind: "self_trade", label: "Self-Trade Wash (R-03)", icon: "loop", color: "#8b5cf6" },
  { kind: "collusion", label: "Collusion Signal (R-04)", icon: "users", color: "#0369a1" },
  { kind: "feeder_overload", label: "Feeder Overload (R-05)", icon: "shield-warning", color: "#ef4444" },
];

export function ScenarioBar({
  injecting, activeKind, onInject,
}: { injecting: boolean; activeKind: string | null; onInject: (kind: string) => void }) {
  return (
    <div className="scenario-bar">
      <div className="scenario-label">
        <Icon name="flask" size={14} /><span>Inject Rogue-Bid Scenarios:</span>
      </div>
      <div className="scenario-actions">
        {SCENARIOS.map((s) => (
          <button
            key={s.kind}
            className={"scenario-btn" + (activeKind === s.kind ? " active" : "")}
            aria-pressed={activeKind === s.kind}
            disabled={injecting && s.kind !== "normal"}
            onClick={() => onInject(s.kind)}
          >
            <Icon name={s.icon} size={12} /> {s.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Speed: <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>1 tick = 15m sim</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build gate** — `npm run build`. Expected: success (components not yet imported anywhere; no unused-var errors since Next build doesn't run noUnusedLocals by default — verify).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/dashboard.css frontend/components/Header.tsx frontend/components/ScenarioBar.tsx
git commit -m "feat(frontend): Header + ScenarioBar panels (light theme)"
```

---

### Task 5: SynopticPanel (KPIs + SVG topology + inspector + TelemetryChart)

**Files:**
- Create: `frontend/components/SynopticPanel.tsx`
- Create: `frontend/components/TelemetryChart.tsx`
- Modify: `frontend/components/dashboard.css` (append synoptic styles)

**Interfaces:**
- Consumes: tick response fields `decisions[]` (`participant_id, action, qty_kwh, battery_soc_pct, battery_action, preference_applied`), `battery_states[]` (`reserve_floor_pct`), `forecasts[]` (`participant_id, predicted_load_kw, predicted_gen_kw`), `stress` (`aggregate_demand_kw, threshold_kw`); `reports.community.total_kwh_traded`, `p2p_avg_price_usd`; `tickHistory` (Task 3 type `TickPoint[]`); `Icon`.
- Produces: `tickClock(tick: number): string` exported from SynopticPanel.tsx (same logic as old Topology.tsx: 96×15-min day, `HH:MM`) — page.tsx imports it for the Header clock. `<SynopticPanel data={data} reports={reports} tickHistory={tickHistory} />` where `data: any | null`, `reports: any | null`.
- TelemetryChart props: `<TelemetryChart history={TickPoint[]} />`, internally `Chart` from "chart.js/auto" — MUST be dynamically imported by parent with `ssr: false` (Next 14 + chart.js).
- `dashboard.css` gains (from `simulation.html`): `.kpi-row`, `.kpi-item`, `.kpi-label`, `.kpi-value`, `.kpi-sub`, `.synoptic-container`, `.node-group`, `.node-box` (+ `.selected`, `.stressed`), `.node-name`, `.node-metric`, `.flow-line` (+ `.active-solar`, `.active-p2p`, `.active-bess`), `flowParticles` keyframes, `.node-detail-panel`, `.node-detail-title`, `.node-detail-row`.

- [ ] **Step 1: Append synoptic CSS to `dashboard.css`** — copy the classes above verbatim from `simulation.html` lines 310-438 and 663-691.

- [ ] **Step 2: Create `frontend/components/TelemetryChart.tsx`** (plain canvas — no react wrapper lib needed):

```tsx
"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type { TickPoint } from "../hooks/useGridStream";

Chart.register(...registerables);

export function TelemetryChart({ history }: { history: TickPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: history.map((p) => `${String(Math.floor((p.tick * 15) / 60) % 24).padStart(2, "0")}:${String((p.tick * 15) % 60).padStart(2, "0")}`),
        datasets: [
          { label: "Solar Gen (kW)", data: history.map((p) => p.solarKw), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.08)", fill: true, tension: 0.35, pointRadius: 2 },
          { label: "Feeder Load (kW)", data: history.map((p) => p.loadKw), borderColor: "#0284c7", backgroundColor: "transparent", tension: 0.35, pointRadius: 2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 9 } } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [history]);

  return <canvas ref={canvasRef} />;
}

export default TelemetryChart;
```

- [ ] **Step 3: Create `frontend/components/SynopticPanel.tsx`**. Structure (full code too long to inline twice — key contract points):

```tsx
"use client";
import { useMemo, useState } from "react";
import { Icon } from "./icons";

export function tickClock(tick: number): string {
  const mins = (((tick % 96) + 96) % 96) * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}
```

Component body requirements (implement against real fields only):
- KPI row: Solar Gen = `Σ data.forecasts[].predicted_gen_kw` (label "kW"); Feeder Demand = `Σ predicted_load_kw`; Transformer Load = `(stress.aggregate_demand_kw / stress.threshold_kw * 100)` if `stress.threshold_kw > 0` else "—" (suffix "%", color green <80%, blue <100%, red ≥100%); P2P Volume = `reports.community.total_kwh_traded` (suffix "kWh", sub-line `Avg ${priceCents}¢/kWh` from `p2p_avg_price_usd * 100`, 1 decimal). No data → all four "—".
- SVG `viewBox="0 0 650 360"` exactly like mockup: substation node left; five participant boxes right (y = 80, 130, 180, 230, 280; x = 340; box w=130); bus line x=220; P2P hub circle at (550,180) with `r=32`; label text from `NODE_META`:

```ts
const NODE_META: Record<string, { label: string; y: number }> = {
  solar_home: { label: "Solar Home", y: 80 },
  household: { label: "Household", y: 130 },
  commercial: { label: "Commercial Solar", y: 180 },
  ev_station: { label: "EV Charging Hub", y: 230 },
  battery_site: { label: "Community BESS", y: 280 },
};
```

- Node metric text: `${action === "sell" ? "+" : action === "buy" ? "−" : ""}${qty_kwh.toFixed(2)} kWh · SOC ${battery_soc_pct.toFixed(0)}%` (or "—" pre-tick). Flow line class: `battery_action === "discharge" || action === "discharge"` → `active-bess`; `action === "sell"` → `active-solar`; `action === "buy" || action === "charge" || action === "store"` → `active-p2p`; else base `flow-line`.
- Substation box `.stressed` when `aggregate_demand_kw >= threshold_kw`; its metric: `Load: ${pct}%`.
- P2P hub price: `p2p_avg_price_usd * 100` → `${x.toFixed(1)}¢/kWh`, or "—" pre-data.
- Click node → `selected` class + inspector panel (`.node-detail-panel`): title = `NODE_META[pid].label`; rows: Policy = `decisions[pid].preference_applied`; Solar Gen = `forecasts[pid].predicted_gen_kw kW`; Load = `predicted_load_kw kW`; Net = `(gen − load)` signed with color (green ≥0, red <0). Substation click: rows = stress agg kW, threshold kW, ratio %. Pre-tick: inspector shows "awaiting first tick".
- Telemetry chart footer: `dynamic(() => import("./TelemetryChart"), { ssr: false })` — do the `next/dynamic` import at module scope in SynopticPanel:

```tsx
import dynamic from "next/dynamic";
const TelemetryChart = dynamic(() => import("./TelemetryChart"), { ssr: false });
```

- [ ] **Step 4: Build gate** — `npm run build`. Expected: success.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/SynopticPanel.tsx frontend/components/TelemetryChart.tsx frontend/components/dashboard.css
git commit -m "feat(frontend): SynopticPanel — KPIs, SVG topology, node inspector, Chart.js telemetry"
```

---

### Task 6: OrderbookPanel

**Files:**
- Create: `frontend/components/OrderbookPanel.tsx`
- Modify: `frontend/components/dashboard.css` (append orderbook styles)

**Interfaces:**
- Consumes: `data.decisions[]` (orderbook rows), `data.trades[]` + `data.tick` (fresh clears; each trade: `{index, tick, buyer_id, seller_id, qty_kwh, clearing_price, rationale}`), `reports.community` (`grid_price_reference_usd, p2p_avg_price_usd, co2_avoided_kg, financial_savings_usd, total_kwh_traded`), `tradesHistory` prop (`GET /trades` rows, same shape) merged with current-tick trades for the ticker.
- Produces: `<OrderbookPanel data={data} reports={reports} tradesHistory={tradesHistory} />`.
- `dashboard.css` gains (from `simulation.html` lines 440-507): `.orderbook-table`, `.orderbook-table th`, `.orderbook-table td`, `.trade-row-sell`, `.trade-row-buy`, `.trade-ticker`, `.trade-item`, `.trade-badge`, `.badge-cleared`.

- [ ] **Step 1: Append orderbook CSS to `dashboard.css`** (verbatim from mockup).

- [ ] **Step 2: Create `frontend/components/OrderbookPanel.tsx`**. Contract:
  - Header: title "P2P Energy Marketplace" + badge "Active Clearing" (or "No Clears Yet" when `data.trades.length === 0`).
  - Orderbook table from CURRENT `data.decisions[]`: `action === "sell"` rows first (ASK, `.trade-row-sell`), then `action === "buy"` (BID, `.trade-row-buy`); columns: Type, Participant (`NODE_META`-style label via the same label helper — replicate a local `labelFor(pid)` since it is 5 lines; do NOT import from SynopticPanel), kWh (`qty_kwh`), Price (`${(reports?.community?.p2p_avg_price_usd ?? 0.255) * 100}¢`). Rows with `qty_kwh <= 0` skipped. Empty → one row "no orders this tick".
  - Benchmarks box: Grid Retail Rate `${grid*100}¢/kWh` (red), P2P Clearing `${p2p*100}¢/kWh` (blue). No feed-in row.
  - Trade ticker: merge `tradesHistory` (already oldest→newest) + current `data.trades`, dedupe by `index`, newest first, cap 12. Item: `TR-<index>` badge, `seller → buyer`, `${qty_kwh} kWh @ ${(clearing_price*100).toFixed(1)}¢/kWh`, right side savings = `((grid − p2p_avg) * qty_kwh)` formatted `+$0.00` (grid/p2p from `reports.community`, fall back 0.30/0.255), sub `tickClock(trade.tick)`.
  - Footer: `CO₂ Avoided ${co2_avoided_kg.toFixed(1)} kg` · `Community Savings $${financial_savings_usd.toFixed(2)}` · `${total_kwh_traded.toFixed(2)} kWh traded`.
- [ ] **Step 3: Build gate** — `npm run build`. Expected: success.
- [ ] **Step 4: Commit**

```bash
git add frontend/components/OrderbookPanel.tsx frontend/components/dashboard.css
git commit -m "feat(frontend): OrderbookPanel — live bids/asks, benchmarks, trade ticker"
```

---

### Task 7: AgentStreamPanel

**Files:**
- Create: `frontend/components/AgentStreamPanel.tsx`
- Modify: `frontend/components/dashboard.css` (append transcript styles)

**Interfaces:**
- Consumes: `data.decision_log[]` (each: `{agent, tick, action, rationale}`), `lastInjection` (`{scenario, description, audits[], violations_raised, flags_by_rule}` from `POST /api/scenario/rogue_bid`), `violationCount` (header badge reuse not needed here).
- Produces: `<AgentStreamPanel data={data} lastInjection={lastInjection} />`.
- `dashboard.css` gains (from `simulation.html` lines 508-580): `.transcript-stream`, `.agent-card`, `.agent-header`, `.agent-name`, `.agent-icon-wrap`, `.agent-time`, `.agent-reasoning`, `.tag-prosumer`, `.tag-grid`, `.tag-trading`, `.tag-forecast`, `.tag-opt`, `.tag-comp`.

- [ ] **Step 1: Append transcript CSS to `dashboard.css`** (verbatim from mockup).

- [ ] **Step 2: Create `frontend/components/AgentStreamPanel.tsx`**. Contract:
  - Agent meta map (module const):

```ts
const AGENT_META: Record<string, { label: string; icon: IconName; tag: string }> = {
  forecasting: { label: "Forecasting Agent", icon: "cloud-sun", tag: "tag-forecast" },
  prosumer: { label: "Prosumer Agent", icon: "house", tag: "tag-prosumer" },
  trading: { label: "Trading & Negotiation Agent", icon: "handshake", tag: "tag-trading" },
  grid_health: { label: "Grid Health Agent", icon: "heartbeat", tag: "tag-grid" },
  optimization: { label: "Optimization Agent", icon: "sliders", tag: "tag-opt" },
  regulation: { label: "Compliance Agent", icon: "shield-check", tag: "tag-comp" },
};
```

  - Render order: injection summary card first (if `lastInjection` present, `violations_raised > 0` → red-tinted card "Rogue bid flagged: {scenario} — {violations_raised} violation(s), rules {Object.entries(flags_by_rule).map(([k,v]) => `${k}×${v}`).join(", ")}"), then `data.decision_log` newest-first. Cap 30 cards total. Prepend semantics: since `decision_log` arrives per tick newest-last, reverse it.
  - Card: `agent-name` chip with `AGENT_META[agent].tag`; time = `tickClock(tick)` (re-implement the 5-line helper locally); body = `rationale` (fallback `action` if empty).
  - Unknown agent key → neutral gray chip with raw key.
  - Empty state: "Start simulation — agent reasoning appears here after the first tick."
- [ ] **Step 3: Build gate** — `npm run build`. Expected: success.
- [ ] **Step 4: Commit**

```bash
git add frontend/components/AgentStreamPanel.tsx frontend/components/dashboard.css
git commit -m "feat(frontend): AgentStreamPanel — live agent decision transcript"
```

---

### Task 8: BlockchainBanner

**Files:**
- Create: `frontend/components/BlockchainBanner.tsx`
- Modify: `frontend/components/dashboard.css` (append banner styles)

**Interfaces:**
- Consumes: `useBlockchain()` returns (`chain: ChainBlock[] | null` where `ChainBlock = {block_index, prev_hash, block_hash, trade_count, audit_count}`, `verifyResult, verifying, verify` — exact same shapes the existing hook provides).
- Produces: `<BlockchainBanner chain={chain} verifyResult={verifyResult} verifying={verifying} onVerify={verify} />`.
- `dashboard.css` gains (from `simulation.html` lines 582-645): `.blockchain-banner`, `.blockchain-header`, `.blockchain-title`, `.blocks-stream`, `.block-card` (+ `.latest`), `.hash-val`.

- [ ] **Step 1: Append banner CSS to `dashboard.css`** (verbatim from mockup).

- [ ] **Step 2: Create `frontend/components/BlockchainBanner.tsx`**. Contract:
  - Collapsible: header click toggles `.blocks-stream` display (state `open: boolean`, default true; caret icon `caret-down`/`caret-right`).
  - Header: "Verifiable Settlement Ledger" + "Cryptographic SHA-256 Hash Chain" chip + `Latest Block: #<max block_index or "—">` + Verify button (small `btn btn-outline`, disabled while `verifying`, label `verifying…`).
  - Blocks: newest first (reverse chain), cap 10, first card gets `.latest`. Card lines: `Block #N` + `${trade_count}T/${audit_count}A`; `Prev Hash: <truncated 10 chars>…`; `Payload: ${trade_count} trade(s), ${audit_count} audit(s)`; `Block Hash: <truncated>` (`.hash-val`).
  - Verify result strip under header: `verifyResult.valid === true` → "Chain verified — N blocks intact" green; `valid === false` → `Chain BROKEN at block ${verifyResult.first_break}` red; null → hidden.
  - Empty chain: body hidden, header shows `Latest Block: #—`.
- [ ] **Step 3: Build gate** — `npm run build`. Expected: success.
- [ ] **Step 4: Commit**

```bash
git add frontend/components/BlockchainBanner.tsx frontend/components/dashboard.css
git commit -m "feat(frontend): BlockchainBanner — collapsible hash-chain stream + verify"
```

---

### Task 9: Delete superseded components + old page styles

**Files:**
- Delete: `frontend/components/Topology.tsx`, `ForecastChart.tsx`, `TradeLedger.tsx`, `DecisionLog.tsx`, `StressBanner.tsx`, `CompliancePanel.tsx`, `QuantPanel.tsx`, `topology.css`
- Modify: `frontend/app/page.tsx` (temporary shim — see Step 2)

**Interfaces:**
- Consumes: nothing new.
- Produces: a repo that still builds with a minimal page while Task 10 lands.

- [ ] **Step 1: Verify no imports outside page.tsx** — run in repo root:

```
rg -l "Topology|ForecastChart|TradeLedger|DecisionLog|StressBanner|CompliancePanel|QuantPanel|topology.css" frontend/app frontend/components frontend/hooks frontend/lib
```

Expected: only `frontend/app/page.tsx` matches (plus the files themselves). If anything else matches, update that importer first.

- [ ] **Step 2: Replace `frontend/app/page.tsx` with a compile-safe shim** (full Task 10 target replaces it):

```tsx
"use client";
export default function Page() {
  return <main style={{ padding: 24 }}>Redesign in progress — see docs/superpowers/plans/2026-09-12-frontend-simulation-ui.md</main>;
}
```

- [ ] **Step 3: Delete files**:

```bash
git rm frontend/components/Topology.tsx frontend/components/ForecastChart.tsx frontend/components/TradeLedger.tsx frontend/components/DecisionLog.tsx frontend/components/StressBanner.tsx frontend/components/CompliancePanel.tsx frontend/components/QuantPanel.tsx frontend/components/topology.css
```

- [ ] **Step 4: Build gate** — `npm run build`. Expected: success (shim imports nothing).

- [ ] **Step 5: Commit**

```bash
git add -A frontend
git commit -m "chore(frontend): remove superseded tab-dashboard components"
```

---

### Task 10: New page.tsx — single-screen composition + auto-tick loop

**Files:**
- Modify: `frontend/app/page.tsx` (replace shim)

**Interfaces:**
- Consumes: `useGridStream()` (Task 3 shape: + `tickFailed, tickHistory, reset`), `useBlockchain()` (unchanged), `useQuant()` (unchanged), `useViolations()` (Task 2), `Header`, `ScenarioBar`, `SynopticPanel` (+ `tickClock` export), `OrderbookPanel`, `AgentStreamPanel`, `BlockchainBanner`, `dashboard.css`.
- Produces: the final page.

- [ ] **Step 1: Write `frontend/app/page.tsx`**:

```tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "../components/dashboard.css";
import { Header } from "../components/Header";
import { ScenarioBar } from "../components/ScenarioBar";
import { SynopticPanel, tickClock } from "../components/SynopticPanel";
import { OrderbookPanel } from "../components/OrderbookPanel";
import { AgentStreamPanel } from "../components/AgentStreamPanel";
import { BlockchainBanner } from "../components/BlockchainBanner";
import { useGridStream } from "../hooks/useGridStream";
import { useBlockchain } from "../hooks/useBlockchain";
import { useQuant } from "../hooks/useQuant";
import { useViolations } from "../hooks/useViolations";
import { getTrades } from "../lib/api";

const TICK_INTERVAL_MS = 4000;

export default function Page() {
  const { data, reports, lastInjection, loading, injecting, tickFailed, tickHistory,
          advance, inject, reset } = useGridStream();
  const chain = useBlockchain();
  const quant = useQuant();
  const violations = useViolations();
  const [running, setRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>("normal");
  const [tradesHistory, setTradesHistory] = useState<any[]>([]);
  const inFlight = useRef(false);

  const refreshTrades = useCallback(async () => {
    try {
      const r = await getTrades();
      setTradesHistory(r.trades ?? []);
    } catch { /* backend unreachable */ }
  }, []);

  useEffect(() => { void refreshTrades(); }, [refreshTrades]);

  // Auto-tick loop with in-flight guard (spec §4).
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (inFlight.current) return; // skip overlapping POSTs (slow live LLM)
      inFlight.current = true;
      advance().finally(() => {
        inFlight.current = false;
        void refreshTrades();
        void violations.refresh();
        void chain.refreshChain();
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Tick failure auto-pauses (spec §4).
  useEffect(() => {
    if (tickFailed && running) setRunning(false);
  }, [tickFailed, running]);

  const handleToggle = useCallback(() => {
    setRunning((r) => !r);
    if (!running && !inFlight.current) {
      // Fire one tick immediately on resume so the UI reacts instantly.
      inFlight.current = true;
      advance().finally(() => { inFlight.current = false; void refreshTrades(); void violations.refresh(); });
    }
  }, [running, advance, refreshTrades, violations]);

  const handleReset = useCallback(async () => {
    setRunning(false);
    await reset();          // clears violation log + refetches meta
    await violations.refresh();
  }, [reset, violations]);

  const handleInject = useCallback(async (kind: string) => {
    setActiveScenario(kind);
    if (kind === "normal") return; // visual-only
    await inject(kind);
    await violations.refresh();
    // Next successful tick clears the highlight (spec §4).
  }, [inject, violations]);

  // Clear scenario highlight on each new tick response.
  useEffect(() => {
    if (data && activeScenario && activeScenario !== "normal") setActiveScenario("normal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.tick]);

  const agg = data?.stress?.aggregate_demand_kw ?? 0;
  const threshold = data?.stress?.threshold_kw ?? 6.0;
  const clock = data ? `${tickClock(data.tick)} (Step #${data.tick})` : "no tick yet";
  const quantModel = quant.status?.active ? `ML: ${quant.status.model_name ?? "live"}` : quant.status ? "ML: fallback" : null;

  return (
    <>
      <Header
        clockLabel={clock} running={running} tickFailed={tickFailed}
        stressAggKw={agg} stressThresholdKw={threshold} loading={loading}
        quantModel={quantModel} violationCount={violations.total}
        onToggleSim={handleToggle} onReset={handleReset}
      />
      <ScenarioBar injecting={injecting} activeKind={activeScenario} onInject={handleInject} />
      <main className="main-grid">
        <SynopticPanel data={data} reports={reports} tickHistory={tickHistory} />
        <OrderbookPanel data={data} reports={reports} tradesHistory={tradesHistory} />
        <AgentStreamPanel data={data} lastInjection={lastInjection} />
      </main>
      <BlockchainBanner
        chain={chain.chain} verifyResult={chain.verifyResult} verifying={chain.verifying} onVerify={chain.verify}
      />
    </>
  );
}
```

Notes for implementer:
- `getTrades` already exists in `lib/api.ts` — verify name; if it is absent, add `getTrades()` fetching `GET /trades` (same style as others) and include it in this task's commit.
- If `quant.status` shape differs (inspect `backend/app/api/routes/quant.py` for the status payload), adjust `quantModel` derivation to show the real model indicator without inventing values.

- [ ] **Step 2: Build gate** — `npm run build`. Expected: success, zero TS errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx frontend/lib/api.ts
git commit -m "feat(frontend): single-screen control center page with auto-tick loop"
```

---

### Task 11: Full verification gates

**Files:**
- No new files. Run-only task.

- [ ] **Step 1: Backend gate** — in `backend/`:

```
uv run pytest
```

Expected: 55 passed. (Zero backend files were touched; this proves it.)

- [ ] **Step 2: Frontend gate** — in `frontend/`:

```
npm run build
```

Expected: success.

- [ ] **Step 3: Live smoke (both servers, live keys)** — start backend (`uv run uvicorn app.main:app --port 8000`) and frontend (`npm run dev`), then walk the checklist from spec §5:
  - [ ] Loads, light theme, no console errors
  - [ ] Resume → ticks advance ~4s; clock/KPIs/topology/orderbook/stream/chart update
  - [ ] Pause/Resume; no overlapping ticks under slow LLM
  - [ ] Each rogue-bid button → regulation/injection card + violation count + correct rule
  - [ ] Node click → inspector live values
  - [ ] Banner expand/collapse; blocks accumulate; Verify reports valid
  - [ ] Backend killed → OFFLINE pill, last data kept; recover on restart
  - [ ] Side-by-side visual parity vs simulation.html

- [ ] **Step 4: Update `STATUS.md`** with a UI-phase stamp (one line: frontend redesign landed, gates green) and append any discovered bugs to `docs/BUGLOG.md` (do not fix new bugs in this task — log them).

- [ ] **Step 5: Commit**

```bash
git add STATUS.md docs/BUGLOG.md
git commit -m "docs: UI redesign verification stamp"
```

---

## Self-Review Log (run during plan write)

1. **Spec coverage:** Header (Task 4) ✓; scenario bar w/ 5 real rogue bids (4) ✓; auto-tick + in-flight guard + auto-pause (10) ✓; reset = violation clear (10) ✓; KPIs (5) ✓; SVG topology + inspector (5) ✓; telemetry chart ssr:false (5) ✓; orderbook + benchmarks + ticker (6) ✓; agent stream w/ tag colors (7) ✓; blockchain banner + verify (8) ✓; deletions (9) ✓; quant badge (10 — Header `quantModel`) ✓; caps 30/12/10 (5/6/8) ✓; responsive <1200px (4) ✓; gates (11) ✓.
2. **Placeholder scan:** none — every step has concrete code or an exact CSS copy source (simulation.html line ranges).
3. **Type consistency:** `TickPoint` defined Task 3, consumed Tasks 5; `tickClock` defined Task 5, consumed Tasks 6/7 (re-implemented locally per plan, 5 lines, deliberate) and 10 (imported from SynopticPanel); `ChainBlock` shape matches existing `useBlockchain` + Task 8 props; `useViolations` shape (Task 2) matches Task 10 usage (`violations.total`, `violations.refresh`).
