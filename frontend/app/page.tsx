"use client";
import { DecisionLog } from "../components/DecisionLog";
import { ForecastChart } from "../components/ForecastChart";
import { StressBanner } from "../components/StressBanner";
import { TradeLedger } from "../components/TradeLedger";
import { useGridStream } from "../hooks/useGridStream";

export default function Page() {
  const { data, loading, advance } = useGridStream();
  return (
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1>GridMesh Operator Dashboard</h1>
      <button onClick={advance} disabled={loading}>
        {loading ? "ticking…" : "Advance tick"}
      </button>
      {data && (
        <>
          <StressBanner stress={data.stress} />
          <ForecastChart forecasts={data.forecasts} />
          <TradeLedger trades={data.trades} />
          <DecisionLog entries={data.decision_log} />
        </>
      )}
    </main>
  );
}
