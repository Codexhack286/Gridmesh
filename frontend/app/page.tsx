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
  const quantModel = quant.status?.status === "live" ? `ML: ${quant.status.model ?? "live"}` : quant.status ? "ML: fallback" : null;

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
