"use client";
import { useState } from "react";
import { BlockchainPanel } from "../components/BlockchainPanel";
import { CompliancePanel } from "../components/CompliancePanel";
import { DecisionLog } from "../components/DecisionLog";
import { ForecastChart } from "../components/ForecastChart";
import { QuantPanel } from "../components/QuantPanel";
import { StressBanner } from "../components/StressBanner";
import { Topology, tickClock } from "../components/Topology";
import { TradeLedger } from "../components/TradeLedger";
import { useBlockchain } from "../hooks/useBlockchain";
import { useGridStream } from "../hooks/useGridStream";
import { useQuant } from "../hooks/useQuant";

type Tab = "overview" | "decisions" | "compliance" | "blockchain" | "quant";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "decisions", label: "Decisions & Trades" },
  { id: "compliance", label: "Compliance & Audit" },
  { id: "blockchain", label: "Blockchain" },
  { id: "quant", label: "Quant Core" },
];

export default function Page() {
  const { data, reports, chainStatus, lastInjection, checkedAt, loading, injecting, advance, inject, check } =
    useGridStream();
  const chain = useBlockchain();
  const quant = useQuant();
  const [tab, setTab] = useState<Tab>("overview");
  const community = reports?.community;
  return (
    <main className="topology-page">
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <h1>
          GridMesh Operator Dashboard{" "}
          <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
            {data ? `Tick ${data.tick} — ${tickClock(data.tick)} (derived)` : "no tick yet"}
          </span>
        </h1>
        <button className="advance-btn" onClick={advance} disabled={loading}>
          {loading ? "ticking…" : "Advance tick"}
        </button>

        <nav className="tabs" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="tab-btn"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <section aria-label="Overview">
            <p className="shell-caption">
              Live topology of the five microgrid participants around the central feeder. Ring fill is battery
              charge, the amber tick marks each participant&apos;s reserve floor, and line color shows whether it is
              selling, charging, or discharging under grid stress.
            </p>
            {data ? (
              <Topology
                tick={data.tick}
                decisions={data.decisions ?? []}
                batteryStates={data.battery_states ?? []}
                stress={data.stress ?? { aggregate_demand_kw: 0, threshold_kw: 6.0, rationale: "" }}
              />
            ) : (
              <p className="shell-empty">Click “Advance tick” to run the first live tick and light up the diagram.</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, margin: "16px 0" }}>
              <div>
                <h3>Traded peer-to-peer</h3>
                <p className="mono">{community ? `${community.total_kwh_traded} kWh` : "—"}</p>
              </div>
              <div>
                <h3>Saved vs grid</h3>
                <p className="mono">{community ? `$${community.financial_savings_usd}` : "—"}</p>
              </div>
              <div>
                <h3>CO₂ avoided</h3>
                <p className="mono">{community ? `${community.co2_avoided_kg} kg` : "—"}</p>
              </div>
            </div>
          </section>
        )}

        {tab === "decisions" && (
          <section aria-label="Decisions and trades">
            <p className="shell-caption">
              Every autonomous decision carries its rationale, and every cleared trade settles below the grid
              reference price. Advance ticks to fill this log with live reasoning, not placeholder copy.
            </p>
            {data ? (
              <>
                <StressBanner stress={data.stress} />
                <ForecastChart forecasts={data.forecasts} />
                <TradeLedger trades={data.trades} />
                <DecisionLog entries={data.decision_log} />
              </>
            ) : (
              <p className="shell-empty">Click “Advance tick” — the stress banner, forecasts, ledger, and log appear here.</p>
            )}
          </section>
        )}

        {tab === "compliance" && (
          <section aria-label="Compliance and audit" className="shell-panel">
            <p className="shell-caption">
              Every audit is SHA-256 hashed and persisted to SQLite; this panel proves it survives a full server
              restart.
            </p>
            <CompliancePanel
              status={chainStatus}
              lastInjection={lastInjection}
              checkedAt={checkedAt}
              onInject={inject}
              onCheck={check}
              injecting={injecting}
            />
          </section>
        )}

        {tab === "blockchain" && (
          <section aria-label="Blockchain" className="shell-panel">
            <p className="shell-caption">
              Each tick&apos;s trades and audits are chained into a block referencing the previous block&apos;s hash —
              tampering with any historical record breaks the chain from that point forward.
            </p>
            <BlockchainPanel
              chain={chain.chain}
              verifyResult={chain.verifyResult}
              demoMode={chain.demoMode}
              verifying={chain.verifying}
              tampering={chain.tampering}
              tamperTick={chain.tamperTick}
              setTamperTick={chain.setTamperTick}
              onVerify={chain.verify}
              onTamper={chain.tamper}
            />
          </section>
        )}

        {tab === "quant" && (
          <section aria-label="Quant core" className="shell-panel">
            <p className="shell-caption">
              Pricing and forecasting models plug in here once trained; until then the rule-based tiers below are the
              live logic.
            </p>
            <QuantPanel status={quant.status} />
          </section>
        )}
      </div>
    </main>
  );
}
