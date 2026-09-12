"use client";
import { Icon, type IconName } from "./icons";

export type TabId = "overview" | "decisions" | "compliance" | "quant" | "sandbox" | "architecture" | "guide";

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
  { id: "sandbox", label: "What-If Sandbox", icon: "flask" },
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
      {/* Executive Topbar Card */}
      <header className="topbar">
        {/* Tier 1: Platform Brand on Left, Primary Simulation Controls on Right */}
        <div className="topbar-row-primary">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <Icon name="circuitry" size={22} />
            </div>
            <div className="brand-text">
              <span className="brand-title-grad">GridMesh</span>
              <span className="brand-subtitle-light">
                Decentralized Energy Intelligence Platform • Indian Smart Microgrid Framework
              </span>
            </div>
          </div>

          <div className="topbar-actions">
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
          </div>
        </div>

        {/* Tier 2: Live Telemetry, Model Status & Compliance Strip */}
        <div className="topbar-row-secondary">
          <div className="topbar-status-left">
            <div className="clock-pill" title="Simulated 15-minute microgrid dispatch clock (96 intervals = 1 full 24-hour cycle)">
              <span className={`pill-dot ${dotState}`} />
              <Icon name="clock" size={12} />
              <span>{clockLabel}</span>
            </div>

            <div className={`status-pill ${stressed ? "critical" : !running ? "paused" : "live"}`}>
              <span className="status-dot" />
              <span>{pillText}</span>
            </div>
          </div>

          <div className="topbar-status-right">
            {quantModel && (
              <span className="meta-badge quant">
                <Icon name="brain" size={12} />
                <span>{quantModel.startsWith("ML:") ? quantModel : `ML: ${quantModel}`}</span>
              </span>
            )}

            {violationCount > 0 ? (
              <span className="meta-badge alert">
                <Icon name="shield-warning" size={12} />
                <span>{violationCount} Violations</span>
              </span>
            ) : (
              <span className="meta-badge clean">
                <Icon name="shield-check" size={12} />
                <span>0 Violations (Clean)</span>
              </span>
            )}

            <span className="meta-badge market">
              <Icon name="scales" size={12} />
              <span>CERC / DISCOM ₹8.00/kWh</span>
            </span>
          </div>
        </div>
      </header>

      {/* Modern Pill Navigation Tabs (Full Width Symmetrical Span) */}
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
