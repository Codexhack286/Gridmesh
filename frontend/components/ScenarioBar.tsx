"use client";
import { Icon } from "./icons";

const SCENARIOS: Array<{ kind: string; label: string; icon: any; color: string }> = [
  { kind: "normal", label: "Normal Dispatch", icon: "check-circle", color: "#10b981" },
  { kind: "predatory_price", label: "Predatory Price (R-01)", icon: "tag-theft", color: "#ef4444" },
  { kind: "bulk_dump", label: "Bulk Dump (R-02)", icon: "boxes", color: "#f59e0b" },
  { kind: "self_trade", label: "Self-Trade Wash (R-03)", icon: "loop", color: "#8b5cf6" },
  { kind: "collusion", label: "Collusion Signal (R-04)", icon: "users", color: "#0369a1" },
  { kind: "feeder_overload", label: "Feeder Overload (R-05)", icon: "shield-warning", color: "#ef4444" },
];

export function ScenarioBar({
  injecting, activeKind, onInject,
}: { injecting: boolean; activeKind: string | null; onInject: (kind: string) => void }) {
  return (
    <div className="scenario-bar">
      <div className="scenario-label">
        <Icon name="flask" size={14} /><span>Inject Rogue-Bid Scenarios:</span>
      </div>
      <div className="scenario-actions">
        {SCENARIOS.map((s) => (
          <button
            key={s.kind}
            className={"scenario-btn" + (activeKind === s.kind ? " active" : "")}
            aria-pressed={activeKind === s.kind}
            disabled={injecting && s.kind !== "normal"}
            onClick={() => onInject(s.kind)}
          >
            <Icon name={s.icon} size={12} /> {s.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Speed: <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>1 tick = 15m sim</span>
      </div>
    </div>
  );
}
