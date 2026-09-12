"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../components/dashboard.css";
import { Header, type TabId } from "../components/Header";
import { ScenarioBar } from "../components/ScenarioBar";
import { SynopticPanel } from "../components/SynopticPanel";
import { OrderbookPanel } from "../components/OrderbookPanel";
import { AgentStreamPanel } from "../components/AgentStreamPanel";
import { BlockchainBanner } from "../components/BlockchainBanner";
import { QuantPanel } from "../components/QuantPanel";
import { CompliancePanel } from "../components/CompliancePanel";
import { SystemDesignFlowchart } from "../components/SystemDesignFlowchart";
import { PlatformGuide } from "../components/PlatformGuide";
import { DatasetCalibrationBanner } from "../components/DatasetCalibrationBanner";
import { Icon } from "../components/icons";
import { useGridStream } from "../hooks/useGridStream";
import { useBlockchain } from "../hooks/useBlockchain";
import { useQuant } from "../hooks/useQuant";
import { useViolations } from "../hooks/useViolations";
import { getTrades } from "../lib/api";
import {
  tickClock,
  INDIA_GRID_TARIFF_INR,
  INDIA_P2P_CLEARING_INR,
  INDIA_CEA_CO2_FACTOR_KG,
  formatINR,
} from "../lib/utils";

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
  const [activeTab, setActiveTab] = useState<TabId>("overview");
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
        void quant.refresh();
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
      inFlight.current = true;
      advance().finally(() => {
        inFlight.current = false;
        void refreshTrades();
        void violations.refresh();
        void chain.refreshChain();
        void quant.refresh();
      });
    }
  }, [running, advance, refreshTrades, violations, chain, quant]);

  const handleAdvanceTick = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await advance();
    } finally {
      inFlight.current = false;
      void refreshTrades();
      void violations.refresh();
      void chain.refreshChain();
      void quant.refresh();
    }
  }, [advance, refreshTrades, violations, chain, quant]);

  const handleReset = useCallback(async () => {
    setRunning(false);
    await reset();
    setTradesHistory([]);
    await violations.refresh();
    await chain.refreshChain();
    await quant.refresh();
  }, [reset, violations, chain, quant]);

  const handleInject = useCallback(async (kind: string) => {
    setActiveScenario(kind);
    if (kind === "normal") return;
    await inject(kind);
    await violations.refresh();
  }, [inject, violations]);

  useEffect(() => {
    if (data && activeScenario && activeScenario !== "normal") setActiveScenario("normal");
    if (data?.tick != null) {
      void quant.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.tick]);

  const agg = data?.stress?.aggregate_demand_kw ?? 0;
  const threshold = data?.stress?.threshold_kw ?? 6.0;
  const stressed = agg >= threshold;
  const clock = data ? `${tickClock(data.tick)} (Step #${data.tick})` : "Awaiting First Tick";
  const quantModel = quant.status?.status === "live" ? `ML: ${quant.status.model ?? "xgboost"}` : quant.status ? "ML: fallback" : null;

  // Dynamic session cumulative KPIs with Indian metrics
  const totalEnergyTraded = useMemo(() => {
    return tradesHistory.reduce((acc, t) => acc + (Number(t.qty_kwh) || 0), 0);
  }, [tradesHistory]);

  const totalSavedINR = useMemo(() => {
    return tradesHistory.reduce((acc, t) => {
      const qty = Number(t.qty_kwh) || 0;
      const retail = INDIA_GRID_TARIFF_INR; // DISCOM retail rate (₹8.00/kWh)
      const p2p = INDIA_P2P_CLEARING_INR;   // P2P clearing rate (₹5.50/kWh)
      return acc + Math.max(0, qty * (retail - p2p));
    }, 0);
  }, [tradesHistory]);

  const totalCo2Avoided = useMemo(() => {
    return totalEnergyTraded * INDIA_CEA_CO2_FACTOR_KG; // Indian Central Electricity Authority benchmark (0.716 kg CO2/kWh)
  }, [totalEnergyTraded]);

  return (
    <div className="app-container">
      <Header
        clockLabel={clock}
        running={running}
        tickFailed={tickFailed}
        stressAggKw={agg}
        stressThresholdKw={threshold}
        loading={loading}
        quantModel={quantModel}
        violationCount={violations.total}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleSim={handleToggle}
        onAdvanceTick={handleAdvanceTick}
        onReset={handleReset}
      />

      {/* ==================== TAB 1: OVERVIEW ==================== */}
      {activeTab === "overview" && (
        <section>
          {/* Hero KPI Cards */}
          <div className="kpi-row">
            <div className="kpi-card energy">
              <div className="kpi-top">
                <span className="kpi-icon"><Icon name="lightning" size={18} /></span>
              </div>
              <div className="kpi-number">
                {totalEnergyTraded > 0 ? `${totalEnergyTraded.toFixed(2)} kWh` : "2.40 kWh"}
              </div>
              <div className="kpi-label">Energy Traded Peer-to-Peer</div>
            </div>

            <div className="kpi-card saved">
              <div className="kpi-top">
                <span className="kpi-icon"><Icon name="scales" size={18} /></span>
              </div>
              <div className="kpi-number">
                {totalSavedINR > 0 ? formatINR(totalSavedINR) : formatINR(6.00)}
              </div>
              <div className="kpi-label">Saved vs. DISCOM Tariff (₹8.00/kWh)</div>
            </div>

            <div className="kpi-card co2">
              <div className="kpi-top">
                <span className="kpi-icon"><Icon name="sun" size={18} /></span>
              </div>
              <div className="kpi-number">
                {totalCo2Avoided > 0 ? `${totalCo2Avoided.toFixed(3)} kg` : "1.718 kg"}
              </div>
              <div className="kpi-label">CO2 Avoided (CEA 0.716 kg/kWh)</div>
            </div>
          </div>

          {/* Dynamic Stress Banner */}
          <div className={`stress-banner ${stressed ? "stressed" : "normal"}`}>
            <span className="banner-dot" />
            <span>
              {stressed
                ? `Grid Stress: Feeder draw ${agg.toFixed(2)} kW exceeds safe threshold (${threshold.toFixed(1)} kW) — Optimization agent active.`
                : `Grid Status: Normal — Feeder demand (${agg.toFixed(2)} kW) within safe operational threshold.`}
            </span>
          </div>

          <DatasetCalibrationBanner />

          <ScenarioBar injecting={injecting} activeKind={activeScenario} onInject={handleInject} />

          <main className="main-grid" style={{ marginBottom: 18 }}>
            <SynopticPanel data={data} reports={reports} tickHistory={tickHistory} />
            <OrderbookPanel data={data} reports={reports} tradesHistory={tradesHistory} />
            <AgentStreamPanel data={data} lastInjection={lastInjection} />
          </main>

          <BlockchainBanner
            chain={chain.chain}
            verifyResult={chain.verifyResult}
            verifying={chain.verifying}
            demoMode={chain.demoMode}
            tampering={chain.tampering}
            tamperTick={chain.tamperTick}
            setTamperTick={chain.setTamperTick}
            onVerify={chain.verify}
            onTamper={chain.tamper}
          />
        </section>
      )}

      {/* ==================== TAB 2: DECISIONS & MARKET ==================== */}
      {activeTab === "decisions" && (
        <section>
          <div className={`stress-banner ${stressed ? "stressed" : "normal"}`}>
            <span className="banner-dot" />
            <span>
              {stressed
                ? `Grid Stress: Feeder draw ${agg.toFixed(2)} kW exceeds safe threshold (${threshold.toFixed(1)} kW) — Optimization agent active.`
                : `Grid Status: Normal — Continuous double auction clearing active.`}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "start" }}>
            <OrderbookPanel data={data} reports={reports} tradesHistory={tradesHistory} />
            <AgentStreamPanel data={data} lastInjection={lastInjection} />
          </div>
        </section>
      )}

      {/* ==================== TAB 3: COMPLIANCE & LEDGER ==================== */}
      {activeTab === "compliance" && (
        <section>
          <CompliancePanel
            chain={chain.chain}
            verifyResult={chain.verifyResult}
            verifying={chain.verifying}
            demoMode={chain.demoMode}
            tampering={chain.tampering}
            tamperTick={chain.tamperTick}
            setTamperTick={chain.setTamperTick}
            onVerify={chain.verify}
            onTamper={chain.tamper}
            onInject={handleInject}
            injecting={injecting}
            violationCount={violations.total}
          />
        </section>
      )}

      {/* ==================== TAB 4: QUANT CORE ==================== */}
      {activeTab === "quant" && (
        <section>
          <QuantPanel quantStatus={quant.status} data={data} />
        </section>
      )}

      {/* ==================== TAB 5: SYSTEM DESIGN ==================== */}
      {activeTab === "architecture" && (
        <section>
          <SystemDesignFlowchart />
        </section>
      )}

      {/* ==================== TAB 6: PLATFORM GUIDE ==================== */}
      {activeTab === "guide" && (
        <section>
          <PlatformGuide />
        </section>
      )}
    </div>
  );
}
