"use client";
import { useState } from "react";
import { Icon, type IconName } from "./icons";

interface LayerNode {
  id: string;
  title: string;
  category: string;
  icon: IconName;
  color: string;
  summary: string;
  technicalSpecs: string[];
  metrics: string;
}

const LAYERS: LayerNode[] = [
  {
    id: "edge",
    title: "1. Empirical Ingestion & IoT Edge Telemetry",
    category: "Telemetry & Indian Feeder Adaptation",
    icon: "circuitry",
    color: "#0B63E5",
    summary: "Automated 15-minute telemetry streaming via IoT Edge Gateways (DLMS/COSEM, Modbus, MQTT) and empirical OPSD smart meter ingestion, calibrated for Indian feeder profiles.",
    technicalSpecs: [
      "Autonomous IoT Edge Gateways: Inverters, smart meters, and battery BMS stream telemetry every 15m automatically (zero human upload)",
      "14,400 empirical 15-min smart meter records across 5 prosumer personas",
      "Calibrated to Indian GHI (5.5-6.5 kWh/m²/day) & IST 11:30-13:30 solar generation peak",
      "Normalized to Indian AC cooling load & 18:00-22:00 domestic feeder evening surges",
      "Calibrated to Central Electricity Authority (CEA) 0.716 kg CO₂/kWh grid baseline"
    ],
    metrics: "14,400 OPSD Records • Automated IoT Stream • IST / CEA Calibrated"
  },
  {
    id: "quant",
    title: "2. Quant ML Forecaster",
    category: "Machine Learning Core",
    icon: "brain",
    color: "#7C3AED",
    summary: "Predicts demand and solar generation 15 minutes into the future before market matching.",
    technicalSpecs: [
      "Voting Ensemble: Random Forest (100 trees, max depth 12) + XGBoost (100 rounds, lr 0.08)",
      "Temporal out-of-sample validation on 7 unseen operational days",
      "Inputs: lagged load, rolling irradiance, hour-of-day, day-of-week, temperature"
    ],
    metrics: "Solar R² 95.62% • Demand R² 70.98%"
  },
  {
    id: "agents",
    title: "3. Multi-Agent Intelligence Layer",
    category: "Autonomous Agent System",
    icon: "users",
    color: "#128A4A",
    summary: "6 autonomous cooperating software agents reason, negotiate, and balance energy flows every tick.",
    technicalSpecs: [
      "Forecasting Agent: Serves interval predictions to prosumer agents",
      "Prosumer Agents: Evaluates net energy balance & natural language preferences",
      "Grid Health Agent: Monitors aggregate feeder draw against safety threshold (6.0 kW)",
      "Optimization Agent: Formulates battery discharge schedule to relieve feeder load"
    ],
    metrics: "6 Active Agents • Sub-Second Tick Response"
  },
  {
    id: "market",
    title: "4. Market Clearing Engine",
    category: "Continuous Double Auction",
    icon: "handshake",
    color: "#C2560C",
    summary: "Clears peer-to-peer trades at the intersection of aggregated buy bids and sell asks.",
    technicalSpecs: [
      "Descending buyer bid queue vs. ascending seller ask queue",
      "Clearing price set at supply-demand midpoint: P_clear = (P_bid + P_ask) / 2",
      "Guaranteed pareto-superior outcomes: Buyers save ~31% vs. DISCOM, sellers earn +112% vs. solar feed-in"
    ],
    metrics: "₹5.50/kWh P2P Avg vs. ₹8.00 DISCOM Retail"
  },
  {
    id: "compliance",
    title: "5. Compliance & Regulatory Shield",
    category: "Automated Policy Enforcement",
    icon: "shield-check",
    color: "#D0223A",
    summary: "Audits every transaction against microgrid rules prior to settlement, auto-voiding rogue bids.",
    technicalSpecs: [
      "R-01: CERC Price ceiling audit (max ₹9.00/kWh to prevent predatory surge gouging)",
      "R-02: SERC Volume transaction quota (10.0 kWh per-trade ceiling)",
      "R-03: Self-trade guard (rejects wash trades where buyer equals seller)",
      "R-04: Anti-collusion detector (flags coordinated transfers below ₹4.00/kWh)",
      "R-05: Distribution Transformer line limit (enforces 8.0 kW physical saturation limit)"
    ],
    metrics: "100% Trades Audited • Sub-5ms Enforcement"
  },
  {
    id: "blockchain",
    title: "6. Verifiable Settlement Ledger",
    category: "Cryptographic SHA-256 Chain",
    icon: "link",
    color: "#0891B2",
    summary: "Appends settled trades and compliance audit receipts into an immutable cryptographic hash chain.",
    technicalSpecs: [
      "Hash pointer linkage: Block_Hash = SHA256(Index + Prev_Hash + Timestamp + Payload)",
      "Stores trade volumes, clearing prices, participant IDs, and audit flags in SQLite",
      "Tamper detection engine: Any direct DB manipulation breaks cryptographic linkage"
    ],
    metrics: "Zero Gas Fees • Provable SHA-256 Integrity"
  },
  {
    id: "sandbox",
    title: "7. Interactive What-If Decision Sandbox",
    category: "Stateless Parameter Injection & Evaluation",
    icon: "flask",
    color: "#6366F1",
    summary: "Interactive evaluator and operator simulation suite for testing agent decision logic under arbitrary operational conditions.",
    technicalSpecs: [
      "Stateless simulation endpoint (POST /api/simulate/decision) without ledger mutation",
      "Live sliders for Solar PV (0-12 kW), Load (0-12 kW), Battery SOC (0-100%), and P2P Tariff",
      "Dynamic agent reasoning output: Action badges, natural-language rationale, and orderbook emission",
      "Instant stress testing of transformer safety thresholds and CERC regulatory guardrails"
    ],
    metrics: "Sub-50ms Evaluation • 5 Quick Presets • Zero Side-Effects"
  },
  {
    id: "dashboard",
    title: "8. Operator Control Console",
    category: "Real-Time Operator Interface",
    icon: "gauge",
    color: "#475569",
    summary: "Reactive Next.js user interface visualizing feeder topology, orderbook depth, and agent decisions.",
    technicalSpecs: [
      "Live SVG feeder topology with directional animated current flow lines",
      "Live trade ticker with individual community savings calculations",
      "Interactive scenario injection suite and live tamper verification triggers"
    ],
    metrics: "Turbopack Build • Sub-100ms UI Latency"
  }
];

export function SystemDesignFlowchart() {
  const [selectedLayer, setSelectedLayer] = useState<string>("agents");
  const activeNode = LAYERS.find((l) => l.id === selectedLayer) ?? LAYERS[2];

  return (
    <div className="flowchart-view">
      <div className="flowchart-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--current)", background: "var(--current-soft)", padding: "3px 10px", borderRadius: 999, marginBottom: 8 }}>
              Architecture Specification
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
              GridMesh System Architecture &amp; Data Pipeline
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--slate)", margin: 0, maxWidth: 740, lineHeight: 1.5 }}>
              End-to-end dataflow pipeline demonstrating how raw physical IoT readings transition through machine learning forecasters, autonomous negotiating agents, continuous double-auction clearing, regulatory compliance guards, and cryptographic blockchain settlement.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: "var(--slate-soft)", fontWeight: 500 }}>Cycle Duration:</span>
            <span style={{ fontSize: 12, fontWeight: 700, background: "var(--surface)", border: "1px solid var(--line)", padding: "4px 10px", borderRadius: 6, color: "var(--ink)" }}>
              15 Min / Tick
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Sequence */}
      <div className="card-light">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="section-title-light">Interactive Architectural Layers</h3>
          <span style={{ fontSize: 12, color: "var(--slate-soft)" }}>Select any layer to inspect technical specifications</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
          {LAYERS.map((layer, idx) => {
            const isSelected = layer.id === selectedLayer;
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: isSelected ? `2px solid ${layer.color}` : "1px solid var(--line)",
                  background: isSelected ? "var(--surface)" : "#FAFBFD",
                  boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.16s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: layer.color }}>STAGE {idx + 1}</span>
                  <span style={{ color: layer.color }}>
                    <Icon name={layer.icon} size={15} />
                  </span>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>
                  {layer.title.replace(/^\d+\.\s*/, "")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Layer Technical Detail Card */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: `4px solid ${activeNode.color}`,
            borderRadius: "var(--radius)",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: activeNode.color, letterSpacing: "0.04em" }}>
                {activeNode.category}
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "2px 0 0", color: "var(--ink)" }}>
                {activeNode.title}
              </h3>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, background: "var(--surface)", border: "1px solid var(--line)", padding: "4px 12px", borderRadius: 999, color: "var(--ink)" }}>
              {activeNode.metrics}
            </span>
          </div>

          <p style={{ fontSize: 13.5, color: "var(--slate)", margin: "0 0 14px", lineHeight: 1.5 }}>
            {activeNode.summary}
          </p>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "var(--slate-soft)", display: "block", marginBottom: 8 }}>
              Implementation Specifications
            </span>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--ink)", display: "flex", flexDirection: "column", gap: 6 }}>
              {activeNode.technicalSpecs.map((spec, sIdx) => (
                <li key={sIdx} style={{ lineHeight: 1.45 }}>{spec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* SVG Process Flowchart Diagram */}
      <div className="card-light">
        <h3 className="section-title-light" style={{ marginBottom: 4 }}>End-to-End Execution Flowchart</h3>
        <p className="section-hint-light" style={{ marginBottom: 18 }}>
          Sequential execution path of energy telemetry and trading logic within each 15-minute dispatch interval.
        </p>

        <div style={{ width: "100%", overflowX: "auto", paddingBottom: 8 }}>
          <svg viewBox="0 0 940 320" width="100%" height="320" style={{ minWidth: 840 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8C97AC" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0B63E5" />
              </marker>
            </defs>

            {/* Connecting lines */}
            <path d="M 120 70 L 190 70" stroke="#CFD8E3" strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
            <path d="M 330 70 L 400 70" stroke="#CFD8E3" strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
            <path d="M 540 70 L 610 70" stroke="#CFD8E3" strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
            <path d="M 750 70 L 820 70" stroke="#CFD8E3" strokeWidth="2" markerEnd="url(#arrow)" fill="none" />

            {/* Row 2 connections */}
            <path d="M 875 110 L 875 180 L 820 220" stroke="#CFD8E3" strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
            <path d="M 680 220 L 610 220" stroke="#CFD8E3" strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
            <path d="M 470 220 L 400 220" stroke="#0B63E5" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-blue)" fill="none" />

            {/* Node 1: Edge Telemetry */}
            <g transform="translate(10, 30)">
              <rect width="110" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="110" height="4" rx="2" fill="#0B63E5" />
              <text x="55" y="32" textAnchor="middle" fontSize="10" fontWeight="700" fill="#10182B">1. OPSD Telemetry</text>
              <text x="55" y="50" textAnchor="middle" fontSize="9" fill="#5D6B82">Indian Calibrated</text>
              <text x="55" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0B63E5">96 Ticks / IST</text>
            </g>

            {/* Node 2: Quant Forecaster */}
            <g transform="translate(190, 30)">
              <rect width="140" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="140" height="4" rx="2" fill="#7C3AED" />
              <text x="70" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10182B">2. ML Forecaster</text>
              <text x="70" y="50" textAnchor="middle" fontSize="9.5" fill="#5D6B82">XGBoost + RF</text>
              <text x="70" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#7C3AED">R² 95.6% Solar</text>
            </g>

            {/* Node 3: Prosumer Agents */}
            <g transform="translate(400, 30)">
              <rect width="140" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="140" height="4" rx="2" fill="#128A4A" />
              <text x="70" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10182B">3. Prosumer Agents</text>
              <text x="70" y="50" textAnchor="middle" fontSize="9.5" fill="#5D6B82">Net Balance &amp; SOC</text>
              <text x="70" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#128A4A">5 Personas</text>
            </g>

            {/* Node 4: Trading Engine */}
            <g transform="translate(610, 30)">
              <rect width="140" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="140" height="4" rx="2" fill="#C2560C" />
              <text x="70" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10182B">4. Trading Agent</text>
              <text x="70" y="50" textAnchor="middle" fontSize="9.5" fill="#5D6B82">Double Auction</text>
              <text x="70" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#C2560C">P_clear Matching</text>
            </g>

            {/* Node 5: Grid Health */}
            <g transform="translate(820, 30)">
              <rect width="110" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="110" height="4" rx="2" fill="#D0223A" />
              <text x="55" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10182B">5. Health &amp; Opt</text>
              <text x="55" y="50" textAnchor="middle" fontSize="9.5" fill="#5D6B82">Feeder &lt; 6 kW</text>
              <text x="55" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#D0223A">BESS Dispatch</text>
            </g>

            {/* Node 6: Compliance Agent */}
            <g transform="translate(680, 180)">
              <rect width="140" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="140" height="4" rx="2" fill="#D0223A" />
              <text x="70" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10182B">6. Compliance Agent</text>
              <text x="70" y="50" textAnchor="middle" fontSize="9.5" fill="#5D6B82">Rules R-01 to R-05</text>
              <text x="70" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#D0223A">Auto-Void Rogue</text>
            </g>

            {/* Node 7: Blockchain Ledger */}
            <g transform="translate(470, 180)">
              <rect width="140" height="80" rx="8" fill="#F8FAFC" stroke="#E3E8F0" strokeWidth="1.5" />
              <rect x="0" y="0" width="140" height="4" rx="2" fill="#0891B2" />
              <text x="70" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10182B">7. Blockchain Ledger</text>
              <text x="70" y="50" textAnchor="middle" fontSize="9.5" fill="#5D6B82">SHA-256 Hash Chain</text>
              <text x="70" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0891B2">SQLite Immutability</text>
            </g>

            {/* Node 8: Operator Console */}
            <g transform="translate(230, 180)">
              <rect width="170" height="80" rx="8" fill="#EFF6FF" stroke="#0B63E5" strokeWidth="1.5" />
              <rect x="0" y="0" width="170" height="4" rx="2" fill="#0B63E5" />
              <text x="85" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0B63E5">8. Operator Console</text>
              <text x="85" y="50" textAnchor="middle" fontSize="9.5" fill="#10182B">Next.js Real-Time UI</text>
              <text x="85" y="66" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0B63E5">Reactive Telemetry</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
