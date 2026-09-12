"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "./icons";

const TelemetryChart = dynamic(() => import("./TelemetryChart"), { ssr: false });

import { tickClock } from "../lib/utils";
export { tickClock };

const NODE_META: Record<string, { label: string; y: number }> = {
  solar_home: { label: "Solar Home", y: 80 },
  household: { label: "Household", y: 130 },
  commercial: { label: "Commercial Solar", y: 180 },
  ev_station: { label: "EV Charging Hub", y: 230 },
  battery_site: { label: "Community BESS", y: 280 },
};

const NODE_ORDER = ["solar_home", "household", "commercial", "ev_station", "battery_site"];

function flowClass(decision: any): string {
  const batteryAction = String(decision?.battery_action ?? "").toLowerCase();
  const action = String(decision?.action ?? "").toLowerCase();
  if (batteryAction === "discharge" || action === "discharge") return "flow-line active-bess";
  if (action === "sell") return "flow-line active-solar";
  if (action === "buy" || action === "charge" || action === "store") return "flow-line active-p2p";
  return "flow-line";
}

function nodeMetric(decision: any): string {
  if (!decision) return "—";
  const action = String(decision.action ?? "").toLowerCase();
  const sign = action === "sell" ? "+" : action === "buy" ? "−" : "";
  const qty = Number(decision.qty_kwh);
  const soc = Number(decision.battery_soc_pct);
  const qtyStr = Number.isFinite(qty) ? qty.toFixed(2) : "—";
  const socStr = Number.isFinite(soc) ? ` · SOC ${soc.toFixed(0)}%` : "";
  return `${sign}${qtyStr} kWh${socStr}`;
}

export function SynopticPanel({
  data,
  reports,
  tickHistory,
}: {
  data: any | null;
  reports: any | null;
  tickHistory: import("../hooks/useGridStream").TickPoint[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const decisionsById = useMemo(() => {
    const m: Record<string, any> = {};
    for (const d of data?.decisions ?? []) m[d.participant_id] = d;
    return m;
  }, [data]);

  const forecastsById = useMemo(() => {
    const m: Record<string, any> = {};
    for (const f of data?.forecasts ?? []) m[f.participant_id] = f;
    return m;
  }, [data]);

  const hasData = !!data;
  const solarKw = hasData && Array.isArray(data.forecasts)
    ? data.forecasts.reduce((a: number, x: any) => a + (Number(x.predicted_gen_kw) || 0), 0)
    : null;
  const loadKw = hasData && Array.isArray(data.forecasts)
    ? data.forecasts.reduce((a: number, x: any) => a + (Number(x.predicted_load_kw) || 0), 0)
    : null;
  const aggKw = Number(data?.stress?.aggregate_demand_kw);
  const thresholdKw = Number(data?.stress?.threshold_kw);
  const hasStress = Number.isFinite(aggKw) && Number.isFinite(thresholdKw) && thresholdKw > 0;
  const loadPct = hasStress ? (aggKw / thresholdKw) * 100 : null;
  const stressed = hasStress && aggKw >= thresholdKw;
  const p2pKwh = Number(reports?.community?.total_kwh_traded);
  const p2pAvg = Number(reports?.community?.p2p_avg_price_usd);
  const hasP2p = Number.isFinite(p2pKwh);
  const priceCents = Number.isFinite(p2pAvg) ? (p2pAvg * 100).toFixed(1) : null;

  const xfmrColor = loadPct === null ? undefined : loadPct >= 100 ? "#ef4444" : loadPct >= 80 ? "#0284c7" : "#10b981";

  const selectedDecision = selected && selected !== "substation" ? decisionsById[selected] : null;
  const selectedForecast = selected && selected !== "substation" ? forecastsById[selected] : null;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <span style={{ color: "var(--brand-blue)", display: "inline-flex" }}>
              <Icon name="circuitry" size={14} />
            </span>
            Microgrid Feeder Synoptic View
          </div>
          <div className="card-subtitle">Real-time low-voltage topology &amp; bi-directional power flows</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>● Solar Gen</span>
          <span style={{ fontSize: 11, color: "#0284c7", fontWeight: 600 }}>● P2P Flow</span>
          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>● Battery BESS</span>
        </div>
      </div>

      <div className="card-body">
        <div className="kpi-row">
          <div className="kpi-item">
            <div className="kpi-label">Total Solar Gen <Icon name="sun" size={12} /></div>
            <div className="kpi-value" style={{ color: "#10b981" }}>
              {solarKw === null ? "—" : `${solarKw.toFixed(2)} kW`}
            </div>
            <div className="kpi-sub">Σ predicted_gen_kw</div>
          </div>
          <div className="kpi-item">
            <div className="kpi-label">Feeder Demand <Icon name="trend-up" size={12} /></div>
            <div className="kpi-value" style={{ color: "#0f172a" }}>
              {loadKw === null ? "—" : `${loadKw.toFixed(2)} kW`}
            </div>
            <div className="kpi-sub">Σ predicted_load_kw</div>
          </div>
          <div className="kpi-item">
            <div className="kpi-label">Transformer Load <Icon name="gauge" size={12} /></div>
            <div className="kpi-value" style={xfmrColor ? { color: xfmrColor } : undefined}>
              {loadPct === null ? "—" : `${loadPct.toFixed(1)}%`}
            </div>
            <div className="kpi-sub">
              {hasStress ? `${aggKw.toFixed(2)} / ${thresholdKw.toFixed(2)} kW` : "stress threshold"}
            </div>
          </div>
          <div className="kpi-item">
            <div className="kpi-label">P2P Volume Traded <Icon name="handshake" size={12} /></div>
            <div className="kpi-value" style={{ color: "#8b5cf6" }}>
              {hasP2p ? `${p2pKwh.toFixed(2)} kWh` : "—"}
            </div>
            <div className="kpi-sub">{priceCents === null ? "no clears yet" : `Avg ${priceCents}¢/kWh`}</div>
          </div>
        </div>

        <div className="synoptic-container">
          <svg className="grid-canvas" viewBox="0 0 650 360">
            <line x1="80" y1="180" x2="220" y2="180" className={stressed ? "flow-line active-bess" : "flow-line active-p2p"} />
            <line x1="220" y1="70" x2="220" y2="290" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
            {NODE_ORDER.map((pid) => (
              <line
                key={pid}
                x1="220"
                y1={NODE_META[pid].y}
                x2="340"
                y2={NODE_META[pid].y}
                className={hasData ? flowClass(decisionsById[pid]) : "flow-line"}
              />
            ))}

            <g className="node-group" onClick={() => setSelected("substation")}>
              <rect
                x="20"
                y="145"
                width="100"
                height="70"
                className={"node-box" + (selected === "substation" ? " selected" : "") + (stressed ? " stressed" : "")}
              />
              <text x="70" y="168" textAnchor="middle" className="node-name">Substation</text>
              <text x="70" y="186" textAnchor="middle" className="node-metric">
                {loadPct === null ? "Load: —" : `Load: ${loadPct.toFixed(0)}%`}
              </text>
              <text x="70" y="202" textAnchor="middle" className="node-metric">
                {hasData ? `T${data.tick} ${tickClock(data.tick)}` : "awaiting tick"}
              </text>
            </g>

            {NODE_ORDER.map((pid) => {
              const y = NODE_META[pid].y;
              return (
                <g key={pid} className="node-group" onClick={() => setSelected(pid)}>
                  <rect
                    x="340"
                    y={y - 25}
                    width="130"
                    height="50"
                    className={"node-box" + (selected === pid ? " selected" : "")}
                  />
                  <text x="352" y={y - 6} className="node-name">{NODE_META[pid].label}</text>
                  <text x="352" y={y + 12} className="node-metric">{nodeMetric(decisionsById[pid])}</text>
                </g>
              );
            })}

            <path d="M 480 80 Q 530 140 540 180" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
            <path d="M 480 180 L 520 180" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
            <path d="M 480 230 Q 530 200 540 180" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />

            <circle cx="550" cy="180" r="32" fill="#eff6ff" stroke="#0284c7" strokeWidth="2" />
            <text x="550" y="177" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0284c7">P2P Hub</text>
            <text x="550" y="190" textAnchor="middle" fontSize="9" fill="#0369a1" fontFamily="monospace">
              {priceCents === null ? "—" : `${priceCents}¢/kWh`}
            </text>
          </svg>

          <div className="node-detail-panel">
            {!hasData || !selected ? (
              <>
                <div className="node-detail-title">{!hasData ? "No tick yet" : "Select a node"}</div>
                <div className="node-detail-row"><span>{!hasData ? "awaiting first tick" : "click a node for live values"}</span></div>
              </>
            ) : selected === "substation" ? (
              <>
                <div className="node-detail-title">Substation</div>
                <div className="node-detail-row"><span>Aggregate demand:</span> <strong>{Number.isFinite(aggKw) ? `${aggKw.toFixed(2)} kW` : "—"}</strong></div>
                <div className="node-detail-row"><span>Threshold:</span> <strong>{Number.isFinite(thresholdKw) ? `${thresholdKw.toFixed(2)} kW` : "—"}</strong></div>
                <div className="node-detail-row"><span>Load ratio:</span> <strong>{loadPct === null ? "—" : `${loadPct.toFixed(1)}%`}</strong></div>
              </>
            ) : (
              (() => {
                const gen = Number(selectedForecast?.predicted_gen_kw);
                const load = Number(selectedForecast?.predicted_load_kw);
                const hasFL = Number.isFinite(gen) && Number.isFinite(load);
                const net = hasFL ? gen - load : null;
                return (
                  <>
                    <div className="node-detail-title">{NODE_META[selected]?.label ?? selected}</div>
                    <div className="node-detail-row"><span>Agent Policy:</span> <strong>{selectedDecision?.preference_applied ?? "—"}</strong></div>
                    <div className="node-detail-row"><span>Solar Gen:</span> <span>{Number.isFinite(gen) ? `${gen.toFixed(2)} kW` : "—"}</span></div>
                    <div className="node-detail-row"><span>Load:</span> <span>{Number.isFinite(load) ? `${load.toFixed(2)} kW` : "—"}</span></div>
                    <div className="node-detail-row">
                      <span>Net:</span>{" "}
                      <strong style={net === null ? undefined : { color: net >= 0 ? "#10b981" : "#ef4444" }}>
                        {net === null ? "—" : `${net >= 0 ? "+" : "−"}${Math.abs(net).toFixed(2)} kW`}
                      </strong>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, height: 110 }}>
          <TelemetryChart history={tickHistory} />
        </div>
      </div>
    </section>
  );
}
