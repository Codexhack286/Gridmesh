"use client";
import { Icon } from "./icons";

export function Header({
  clockLabel, running, tickFailed, stressAggKw, stressThresholdKw,
  loading, quantModel, violationCount, onToggleSim, onReset,
}: {
  clockLabel: string;
  running: boolean;
  tickFailed: boolean;
  stressAggKw: number;
  stressThresholdKw: number;
  loading: boolean;
  quantModel: string | null;
  violationCount: number;
  onToggleSim: () => void;
  onReset: () => void;
}) {
  const stressed = stressAggKw >= stressThresholdKw;
  const pillClass = tickFailed ? "status-pill islanded" : stressed ? "status-pill critical" : "status-pill";
  const pillText = tickFailed ? "OFFLINE / PAUSED" : stressed ? `GRID STRESS (${stressAggKw.toFixed(2)} kW)` : "GRID NORMAL (STABLE)";
  return (
    <header>
      <div className="brand">
        <div className="logo-badge"><Icon name="lightning" size={22} /></div>
        <div>
          <div className="brand-title">GridMesh Control Center</div>
          <div className="brand-subtitle">
            <span>Decentralized Microgrid Agent Network</span><span>•</span>
            <span>OPSD Southern Germany 6-Household Dataset</span>
          </div>
        </div>
      </div>
      <div className="top-controls">
        {quantModel ? <span className="sim-clock mono">{quantModel}</span> : null}
        <div className="sim-clock"><Icon name="clock" size={14} /><span>{clockLabel}</span></div>
        <div className={pillClass} id="grid-status-pill">
          <span className="status-dot" /><span>{pillText}</span>
        </div>
        <button className="btn btn-primary" onClick={onToggleSim} disabled={loading}>
          <Icon name={running ? "pause" : "play"} size={14} />
          <span>{running ? "Pause Sim" : "Resume Sim"}</span>
        </button>
        <button className="btn btn-outline" onClick={onReset} title="Clears the violation log only — the sim clock and ledger persist server-side">
          <Icon name="reset" size={14} /><span>Reset</span>
        </button>
        {violationCount > 0 && (
          <span className="status-pill critical"><Icon name="shield-warning" size={12} />{violationCount} violations</span>
        )}
      </div>
    </header>
  );
}
