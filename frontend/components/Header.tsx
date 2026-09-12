"use client";
import { Icon, type IconName } from "./icons";

export type TabId = "overview" | "decisions" | "compliance" | "quant" | "architecture" | "guide";

interface TabItem {
  id: TabId;
  label: string;
  icon: IconName;
}

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: "lightning" },
  { id: "decisions", label: "Decisions & Market", icon: "handshake" },
  { id: "compliance", label: "Compliance & Ledger", icon: "shield-check" },
  { id: "quant", label: "Quant Core", icon: "brain" },
  { id: "architecture", label: "System Design", icon: "circuitry" },
  { id: "guide", label: "Platform Guide", icon: "sliders" },
];

export function Header({
  clockLabel,
  running,
  tickFailed,
  stressAggKw,
  stressThresholdKw,
  loading,
  quantModel,
  violationCount,
  activeTab,
  onTabChange,
  onToggleSim,
  onAdvanceTick,
  onReset,
}: {
  clockLabel: string;
  running: boolean;
  tickFailed: boolean;
  stressAggKw: number;
  stressThresholdKw: number;
  loading: boolean;
  quantModel: string | null;
  violationCount: number;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onToggleSim: () => void;
  onAdvanceTick: () => void;
  onReset: () => void;
}) {
  const stressed = stressAggKw >= stressThresholdKw;
  const dotState = tickFailed ? "offline" : !running ? "paused" : stressed ? "stressed" : "live";
  const pillText = tickFailed
    ? "Simulation Error"
    : !running
    ? "Simulation Paused"
    : stressed
    ? `Grid Stress (${stressAggKw.toFixed(2)} kW)`
    : "Simulation Running (Live)";

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Topbar */}
      <header className="topbar">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Icon name="circuitry" size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title-grad">GridMesh</span>
            <span className="brand-subtitle-light">Decentralized Energy Intelligence Platform • Indian Smart Microgrid Framework</span>
          </div>
        </div>

        <div className="topbar-right">
          {quantModel && (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--voltage)", background: "var(--voltage-soft)", padding: "4px 10px", borderRadius: 999 }}>
              {quantModel}
            </span>
          )}

          <div className="clock-pill">
            <span className={`pill-dot ${dotState}`} />
            <span>{clockLabel}</span>
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 999,
            background: stressed ? "var(--alert-soft)" : !running ? "#F1F5F9" : "var(--leaf-soft)",
            color: stressed ? "#9C1B2E" : !running ? "#475569" : "#0C6B3A",
            border: `1px solid ${stressed ? "rgba(208,34,58,0.2)" : !running ? "#CBD5E1" : "rgba(18,138,74,0.2)"}`
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: stressed ? "var(--alert)" : !running ? "#94A3B8" : "var(--leaf)",
              display: "inline-block"
            }} />
            <span>{pillText}</span>
          </div>

          {/* Primary Simulation Controls */}
          <button
            className={`btn ${running ? "btn-warn" : "btn-primary"}`}
            onClick={onToggleSim}
            disabled={loading}
            title={running ? "Pause automatic 15-minute simulation loop" : "Start automatic 15-minute simulation loop (every 4s)"}
          >
            <Icon name={running ? "pause" : "play"} size={13} />
            <span>{running ? "Pause Sim" : "Auto Run (4s)"}</span>
          </button>

          <button
            className="btn btn-ghost"
            onClick={onAdvanceTick}
            disabled={loading || running}
            title="Step forward by one 15-minute simulation interval"
          >
            <Icon name="clock" size={13} />
            <span>Step +15m</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={onReset}
            title="Clears session violation log; sim clock and ledger persist on backend"
          >
            <Icon name="reset" size={13} />
            <span>Reset</span>
          </button>

          {violationCount > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--alert)", background: "var(--alert-soft)", padding: "5px 10px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="shield-warning" size={12} />
              <span>{violationCount} Violations</span>
            </span>
          )}
        </div>
      </header>

      {/* Modern Pill Navigation Tabs */}
      <nav className="tabs-nav" role="tablist" aria-label="Microgrid Views">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`tab-btn${isActive ? " active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon name={tab.icon} size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
