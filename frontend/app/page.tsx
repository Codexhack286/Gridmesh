"use client";
import { CompliancePanel } from "../components/CompliancePanel";
import { DecisionLog } from "../components/DecisionLog";
import { ForecastChart } from "../components/ForecastChart";
import { StressBanner } from "../components/StressBanner";
import { Topology, tickClock } from "../components/Topology";
import { TradeLedger } from "../components/TradeLedger";
import { useGridStream } from "../hooks/useGridStream";
import "../components/topology.css";

export default function Page() {
  const { data, reports, chainStatus, lastInjection, checkedAt, loading, injecting, advance, inject, check } =
    useGridStream();
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
        {data && (
          <Topology
            tick={data.tick}
            decisions={data.decisions ?? []}
            batteryStates={data.battery_states ?? []}
            stress={data.stress ?? { aggregate_demand_kw: 0, threshold_kw: 6.0, rationale: "" }}
          />
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
        {data && (
          <>
            <StressBanner stress={data.stress} />
            <ForecastChart forecasts={data.forecasts} />
            <TradeLedger trades={data.trades} />
            <DecisionLog entries={data.decision_log} />
          </>
        )}
        <CompliancePanel
          status={chainStatus}
          lastInjection={lastInjection}
          checkedAt={checkedAt}
          onInject={inject}
          onCheck={check}
          injecting={injecting}
        />
      </div>
    </main>
  );
}
