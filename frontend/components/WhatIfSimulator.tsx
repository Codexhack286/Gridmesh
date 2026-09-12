"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "./icons";
import { formatINR } from "../lib/utils";

interface WhatIfResponse {
  participant_id: string;
  participant_name: string;
  inputs: {
    solar_kw: number;
    load_kw: number;
    battery_soc_pct: number;
    p2p_price_inr: number;
    grid_tariff_inr: number;
    feeder_threshold_kw: number;
  };
  net_energy: {
    net_kw: number;
    status: "surplus" | "deficit" | "balanced";
    surplus_kw: number;
    deficit_kw: number;
  };
  decision: {
    action: string;
    battery_action: string;
    qty_kwh: number;
    battery_soc_pct: number;
    reserve_floor_pct: number;
    sell_threshold_pct: number;
    rationale: string;
  };
  orderbook: {
    type: string;
    side: string;
    qty_kwh: number;
    target_price_inr: number;
    emitted: boolean;
  };
  grid_health: {
    total_feeder_draw_kw: number;
    threshold_kw: number;
    stressed: boolean;
    optimization_override: {
      mode: string;
      trigger: string;
      bess_command: string;
      relieved_draw_kw: number;
    } | null;
  };
  regulation: {
    compliant: boolean;
    violations: Array<{
      rule_id: string;
      name: string;
      detail: string;
      severity: string;
      enforcement: string;
    }>;
    rules_checked: string[];
  };
  financial_impact: {
    unit_savings_inr: number;
    interval_savings_inr: number;
    co2_avoided_kg: number;
  };
}

const PARTICIPANTS = [
  { id: "solar_home", name: "Solar Home A (Prosumer)" },
  { id: "household", name: "Residential Cluster B (Pure Consumer)" },
  { id: "commercial", name: "Commercial Solar C (Large Prosumer)" },
  { id: "ev_station", name: "EV Charging Hub D (Flexible Consumer)" },
  { id: "battery_site", name: "Community BESS E (Storage Node)" },
];

const PRESETS = [
  {
    id: "noon_peak",
    label: "Noon Solar Export",
    icon: "sun",
    pid: "solar_home",
    solar: 6.8,
    load: 1.2,
    soc: 92,
    price: 6.20,
    threshold: 6.0,
    hint: "High solar + full battery triggers P2P market Sell Ask",
  },
  {
    id: "morning_charge",
    label: "Battery Self-Storage",
    icon: "loop",
    pid: "solar_home",
    solar: 4.5,
    load: 1.0,
    soc: 35,
    price: 6.20,
    threshold: 6.0,
    hint: "Surplus with SOC < 80% prioritizes battery charging over export",
  },
  {
    id: "evening_deficit",
    label: "Evening Deficit",
    icon: "house",
    pid: "household",
    solar: 0.0,
    load: 3.6,
    soc: 15,
    price: 6.20,
    threshold: 6.0,
    hint: "Zero solar + high load triggers P2P Buy Bid to avoid DISCOM peak",
  },
  {
    id: "feeder_overload",
    label: "Feeder Overload (BESS)",
    icon: "shield-warning",
    pid: "ev_station",
    solar: 0.0,
    load: 7.8,
    soc: 20,
    price: 6.20,
    threshold: 6.0,
    hint: "Feeder loading exceeds 6.0 kW, triggering BESS peak shaving",
  },
  {
    id: "cerc_violation",
    label: "CERC Price Collar Spike",
    icon: "tag-theft",
    pid: "solar_home",
    solar: 5.0,
    load: 1.0,
    soc: 90,
    price: 11.50,
    threshold: 6.0,
    hint: "Price of ₹11.50/kWh breaches CERC ₹9.00 ceiling, blocking trade",
  },
];

export function WhatIfSimulator() {
  const [participantId, setParticipantId] = useState("solar_home");
  const [solarKw, setSolarKw] = useState(6.8);
  const [loadKw, setLoadKw] = useState(1.2);
  const [batterySoc, setBatterySoc] = useState(92);
  const [p2pPrice, setP2pPrice] = useState(6.20);
  const [thresholdKw, setThresholdKw] = useState(6.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [activePreset, setActivePreset] = useState<string>("noon_peak");

  const runSimulation = useCallback(async (
    pid: string,
    solar: number,
    load: number,
    soc: number,
    price: number,
    thresh: number
  ) => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/simulate/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: pid,
          solar_kw: solar,
          load_kw: load,
          battery_soc_pct: soc,
          p2p_price_inr: price,
          grid_tariff_inr: 7.80,
          feeder_threshold_kw: thresh,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial evaluation on mount
  useEffect(() => {
    void runSimulation(participantId, solarKw, loadKw, batterySoc, p2pPrice, thresholdKw);
  }, []);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setParticipantId(preset.pid);
    setSolarKw(preset.solar);
    setLoadKw(preset.load);
    setBatterySoc(preset.soc);
    setP2pPrice(preset.price);
    setThresholdKw(preset.threshold);
    void runSimulation(preset.pid, preset.solar, preset.load, preset.soc, preset.price, preset.threshold);
  };

  const handleTriggerSim = () => {
    setActivePreset("");
    void runSimulation(participantId, solarKw, loadKw, batterySoc, p2pPrice, thresholdKw);
  };

  const action = result?.decision?.action ?? "IDLE";
  const actionColor =
    action === "SELL"
      ? "var(--leaf)"
      : action === "BUY"
      ? "var(--voltage)"
      : action === "CHARGE"
      ? "#D97706"
      : action === "DISCHARGE"
      ? "#7C3AED"
      : "var(--ink)";

  const isCompliant = result?.regulation?.compliant !== false;
  const isStressed = result?.grid_health?.stressed === true;

  return (
    <div className="whatif-container">
      {/* Top Banner */}
      <div className="whatif-header-card">
        <div className="whatif-header-left">
          <div className="whatif-badge-icon">
            <Icon name="flask" size={20} />
          </div>
          <div>
            <h2 className="whatif-title">Interactive What-If Decision Sandbox</h2>
            <p className="whatif-subtitle">
              Live Parameter Injection Engine • Observe Autonomous Agent Reasoning and Market Reaction Statelessly
            </p>
          </div>
        </div>
        <div className="whatif-header-right">
          <span className="whatif-pill-engine">
            <span className="whatif-dot-pulse" />
            Stateless Pipeline Active • Zero Ledger Side-Effects
          </span>
        </div>
      </div>

      {/* Preset Quick Select Chips */}
      <div className="whatif-presets-bar">
        <span className="whatif-presets-label">
          <Icon name="lightning" size={13} />
          <span>Quick Scenario Presets:</span>
        </span>
        <div className="whatif-presets-list">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`whatif-preset-btn ${activePreset === p.id ? "active" : ""}`}
              onClick={() => handleApplyPreset(p)}
              title={p.hint}
            >
              <Icon name={p.icon as any} size={13} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Grid: Controls on Left, Live Output on Right */}
      <div className="whatif-main-grid">
        {/* Left Column: Parameter Inputs Card */}
        <div className="card-light whatif-controls-card">
          <div className="card-header-between" style={{ marginBottom: 16 }}>
            <h3 className="section-title-light" style={{ margin: 0 }}>
              <Icon name="sliders" size={16} />
              <span>Override Prosumer Parameters</span>
            </h3>
            <button
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: 12 }}
              onClick={handleTriggerSim}
              disabled={loading}
            >
              {loading ? "Evaluating..." : "Run Agent Reasoning"}
            </button>
          </div>

          {/* Participant Select */}
          <div className="whatif-control-group">
            <label className="whatif-label">Participant Entity</label>
            <select
              className="whatif-select"
              value={participantId}
              onChange={(e) => {
                setParticipantId(e.target.value);
                setActivePreset("");
              }}
            >
              {PARTICIPANTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Solar PV Generation Slider */}
          <div className="whatif-control-group">
            <div className="whatif-control-header">
              <span className="whatif-label">Solar PV Generation</span>
              <span className="whatif-value-pill" style={{ color: "var(--leaf)" }}>
                {solarKw.toFixed(2)} kW
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={12.0}
              step={0.1}
              value={solarKw}
              className="whatif-slider"
              onChange={(e) => {
                setSolarKw(parseFloat(e.target.value));
                setActivePreset("");
              }}
            />
            <div className="whatif-slider-bounds">
              <span>0.0 kW (Night / Overcast)</span>
              <span>12.0 kW (Peak Array)</span>
            </div>
          </div>

          {/* Demand Load Slider */}
          <div className="whatif-control-group">
            <div className="whatif-control-header">
              <span className="whatif-label">Prosumer Demand Load</span>
              <span className="whatif-value-pill" style={{ color: "var(--voltage)" }}>
                {loadKw.toFixed(2)} kW
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={12.0}
              step={0.1}
              value={loadKw}
              className="whatif-slider"
              onChange={(e) => {
                setLoadKw(parseFloat(e.target.value));
                setActivePreset("");
              }}
            />
            <div className="whatif-slider-bounds">
              <span>0.0 kW (Baseload Idle)</span>
              <span>12.0 kW (Heavy Surge)</span>
            </div>
          </div>

          {/* Battery SOC Slider */}
          <div className="whatif-control-group">
            <div className="whatif-control-header">
              <span className="whatif-label">Battery State of Charge (SOC)</span>
              <span className="whatif-value-pill" style={{ color: "#D97706" }}>
                {batterySoc.toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={batterySoc}
              className="whatif-slider"
              onChange={(e) => {
                setBatterySoc(parseInt(e.target.value, 10));
                setActivePreset("");
              }}
            />
            <div className="whatif-slider-bounds">
              <span>0% (Empty)</span>
              <span>80% (Export Threshold)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* P2P Offer Price Slider */}
          <div className="whatif-control-group">
            <div className="whatif-control-header">
              <span className="whatif-label">P2P Bid / Ask Price</span>
              <span
                className="whatif-value-pill"
                style={{ color: p2pPrice > 9.0 ? "#DC2626" : "var(--ink)" }}
              >
                ₹{p2pPrice.toFixed(2)} / kWh
              </span>
            </div>
            <input
              type="range"
              min={3.0}
              max={13.0}
              step={0.1}
              value={p2pPrice}
              className="whatif-slider"
              onChange={(e) => {
                setP2pPrice(parseFloat(e.target.value));
                setActivePreset("");
              }}
            />
            <div className="whatif-slider-bounds">
              <span>₹3.00 (Collusion Floor ₹4.0)</span>
              <span style={{ color: "#DC2626", fontWeight: 600 }}>₹9.00 (CERC Cap)</span>
              <span>₹13.00 (Predatory)</span>
            </div>
          </div>

          {/* Feeder Threshold */}
          <div className="whatif-control-group" style={{ marginBottom: 0 }}>
            <div className="whatif-control-header">
              <span className="whatif-label">Transformer Feeder Safety Limit</span>
              <span className="whatif-value-pill">
                {thresholdKw.toFixed(1)} kW
              </span>
            </div>
            <input
              type="range"
              min={4.0}
              max={10.0}
              step={0.5}
              value={thresholdKw}
              className="whatif-slider"
              onChange={(e) => {
                setThresholdKw(parseFloat(e.target.value));
                setActivePreset("");
              }}
            />
          </div>
        </div>

        {/* Right Column: Live Reasoning & Market Response */}
        <div className="whatif-results-column">
          {/* Card 1: Decision & Action Highlight */}
          <div className="card-light whatif-decision-card">
            <div className="whatif-decision-header">
              <div>
                <span className="whatif-subhead">Autonomous Prosumer Action</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <span
                    className="whatif-action-badge"
                    style={{
                      backgroundColor: `${actionColor}18`,
                      color: actionColor,
                      borderColor: `${actionColor}40`,
                    }}
                  >
                    {action}
                  </span>
                  <span className="whatif-qty-text">
                    {result?.decision?.qty_kwh != null
                      ? `${result.decision.qty_kwh.toFixed(2)} kWh`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="whatif-net-pill">
                <span className="whatif-net-label">Net Balance:</span>
                <span
                  className="whatif-net-val"
                  style={{
                    color:
                      (result?.net_energy?.net_kw ?? 0) > 0
                        ? "var(--leaf)"
                        : (result?.net_energy?.net_kw ?? 0) < 0
                        ? "var(--voltage)"
                        : "var(--ink)",
                  }}
                >
                  {(result?.net_energy?.net_kw ?? 0) > 0 ? "+" : ""}
                  {result?.net_energy?.net_kw?.toFixed(2) ?? "0.00"} kW
                </span>
              </div>
            </div>

            {/* Rationale Callout */}
            <div className="whatif-rationale-box">
              <div className="whatif-rationale-title">
                <Icon name="brain" size={14} />
                <span>Agent Rationale &amp; Optimization Policy</span>
              </div>
              <p className="whatif-rationale-text">
                {result?.decision?.rationale ?? "Awaiting evaluation..."}
              </p>
            </div>
          </div>

          {/* Card 2: Market Order Emission */}
          <div className="card-light whatif-order-card">
            <h4 className="whatif-card-title">
              <Icon name="handshake" size={15} />
              <span>Continuous Double Auction Emission</span>
            </h4>
            <div className="whatif-order-grid">
              <div className="whatif-order-stat">
                <span className="whatif-stat-label">Order Type</span>
                <span className="whatif-stat-val">{result?.orderbook?.type ?? "NONE"}</span>
              </div>
              <div className="whatif-order-stat">
                <span className="whatif-stat-label">Market Side</span>
                <span
                  className="whatif-stat-val"
                  style={{
                    color:
                      result?.orderbook?.side === "SELL"
                        ? "var(--leaf)"
                        : result?.orderbook?.side === "BUY"
                        ? "var(--voltage)"
                        : "var(--slate-soft)",
                  }}
                >
                  {result?.orderbook?.side ?? "NONE"}
                </span>
              </div>
              <div className="whatif-order-stat">
                <span className="whatif-stat-label">Quantity</span>
                <span className="whatif-stat-val">
                  {result?.orderbook?.qty_kwh != null
                    ? `${result.orderbook.qty_kwh.toFixed(2)} kWh`
                    : "0.00 kWh"}
                </span>
              </div>
              <div className="whatif-order-stat">
                <span className="whatif-stat-label">Target Rate</span>
                <span className="whatif-stat-val">
                  ₹{result?.orderbook?.target_price_inr?.toFixed(2) ?? "6.20"}/kWh
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Feeder Health & CERC Regulation Grid */}
          <div className="whatif-split-row">
            {/* Grid Health */}
            <div
              className={`card-light whatif-health-card ${
                isStressed ? "stressed-border" : "normal-border"
              }`}
            >
              <div className="whatif-health-top">
                <span className="whatif-card-title">
                  <Icon name="heartbeat" size={15} />
                  <span>Feeder &amp; Transformer Load</span>
                </span>
                <span
                  className={`whatif-status-chip ${isStressed ? "status-stressed" : "status-safe"}`}
                >
                  {isStressed ? "Feeder Stressed" : "Feeder Normal"}
                </span>
              </div>
              <div className="whatif-health-meter">
                <div className="whatif-meter-labels">
                  <span>Draw: {result?.grid_health?.total_feeder_draw_kw?.toFixed(2) ?? "0.0"} kW</span>
                  <span>Cap: {thresholdKw.toFixed(1)} kW</span>
                </div>
                <div className="whatif-meter-track">
                  <div
                    className="whatif-meter-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        ((result?.grid_health?.total_feeder_draw_kw ?? 0) / thresholdKw) * 100
                      )}%`,
                      backgroundColor: isStressed ? "#DC2626" : "var(--leaf)",
                    }}
                  />
                </div>
              </div>
              {result?.grid_health?.optimization_override && (
                <div className="whatif-bess-alert">
                  <strong>BESS Override: </strong>
                  {result.grid_health.optimization_override.bess_command}
                </div>
              )}
            </div>

            {/* CERC Compliance */}
            <div
              className={`card-light whatif-reg-card ${
                isCompliant ? "compliant-border" : "violation-border"
              }`}
            >
              <div className="whatif-health-top">
                <span className="whatif-card-title">
                  <Icon name="shield-check" size={15} />
                  <span>CERC Regulatory Guard</span>
                </span>
                <span
                  className={`whatif-status-chip ${
                    isCompliant ? "status-safe" : "status-stressed"
                  }`}
                >
                  {isCompliant ? "Fully Compliant" : "Rule Flagged"}
                </span>
              </div>
              {isCompliant ? (
                <p className="whatif-reg-pass">
                  Cleared all statutory checks: CERC ₹9.00/kWh ceiling, SERC 10 kWh volume quota, and anti-dumping floor.
                </p>
              ) : (
                <div className="whatif-reg-violations">
                  {result?.regulation?.violations?.map((v, i) => (
                    <div key={i} className="whatif-violation-item">
                      <strong>{v.rule_id} ({v.name}): </strong>
                      {v.detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Financial & Environmental Net Benefit */}
          <div className="card-light whatif-finance-card">
            <h4 className="whatif-card-title">
              <Icon name="scales" size={15} />
              <span>Interval Economic &amp; Decarbonization Impact</span>
            </h4>
            <div className="whatif-finance-row">
              <div className="whatif-finance-item">
                <span className="whatif-fin-label">Savings vs. DISCOM (₹7.80/kWh)</span>
                <span className="whatif-fin-val" style={{ color: "var(--leaf)" }}>
                  {result?.financial_impact?.unit_savings_inr != null
                    ? `₹${result.financial_impact.unit_savings_inr.toFixed(2)}/kWh`
                    : "₹1.60/kWh"}
                </span>
              </div>
              <div className="whatif-finance-item">
                <span className="whatif-fin-label">Net Interval Economic Value</span>
                <span className="whatif-fin-val" style={{ color: "var(--leaf)" }}>
                  {result?.financial_impact?.interval_savings_inr != null
                    ? formatINR(result.financial_impact.interval_savings_inr)
                    : "₹0.00"}
                </span>
              </div>
              <div className="whatif-finance-item">
                <span className="whatif-fin-label">CO2 Avoided (CEA 0.716 kg/kWh)</span>
                <span className="whatif-fin-val" style={{ color: "var(--voltage)" }}>
                  {result?.financial_impact?.co2_avoided_kg != null
                    ? `${result.financial_impact.co2_avoided_kg.toFixed(3)} kg`
                    : "0.000 kg"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
