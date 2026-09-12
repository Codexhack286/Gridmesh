"use client";
import { Icon, type IconName } from "./icons";

import { tickClock } from "../lib/utils";

const AGENT_META: Record<string, { label: string; icon: IconName; tag: string }> = {
  forecasting: { label: "Forecasting Agent", icon: "cloud-sun", tag: "tag-forecast" },
  prosumer: { label: "Prosumer Agent", icon: "house", tag: "tag-prosumer" },
  trading: { label: "Trading & Negotiation Agent", icon: "handshake", tag: "tag-trading" },
  grid_health: { label: "Grid Health Agent", icon: "heartbeat", tag: "tag-grid" },
  optimization: { label: "Optimization Agent", icon: "sliders", tag: "tag-opt" },
  regulation: { label: "Compliance Agent", icon: "shield-check", tag: "tag-comp" },
};

interface DecisionEntry {
  agent: string;
  tick: number;
  action: string;
  rationale: string;
}

function InjectionCard({ lastInjection }: { lastInjection: any }) {
  const violationsRaised = Number(lastInjection?.violations_raised ?? 0);
  const flags = lastInjection?.flags_by_rule ?? {};
  const rulesLabel = Object.entries(flags)
    .map(([k, v]) => `${k}×${v}`)
    .join(", ");
  const flagged = violationsRaised > 0;
  const scenario = String(lastInjection?.scenario ?? "rogue bid");
  return (
    <div
      className="agent-card"
      style={
        flagged
          ? { background: "var(--red-light)", borderColor: "#fecaca" }
          : undefined
      }
    >
      <div className="agent-header">
        <span
          className="agent-name tag-comp"
          style={{ padding: "2px 8px", borderRadius: 4 }}
        >
          <Icon name="shield-warning" size={12} />
          {flagged ? `Rogue bid flagged: ${scenario}` : `Rogue bid injected: ${scenario}`}
        </span>
      </div>
      <div className="agent-reasoning">
        {flagged
          ? `Rogue bid flagged: ${scenario} — ${violationsRaised} violation(s)${
              rulesLabel ? `, rules ${rulesLabel}` : ""
            }.`
          : `No violations raised by this injection.`}
        {lastInjection?.description ? (
          <div style={{ marginTop: 4 }}>{String(lastInjection.description)}</div>
        ) : null}
      </div>
    </div>
  );
}

export function AgentStreamPanel({
  data,
  lastInjection,
}: {
  data: any | null;
  lastInjection: any | null;
}) {
  const log: DecisionEntry[] = Array.isArray(data?.decision_log)
    ? data.decision_log
    : [];
  // decision_log arrives per tick newest-last → reverse for newest-first display.
  const hasInjection = lastInjection != null;
  const cap = hasInjection ? 29 : 30;
  const entries = [...log].reverse().slice(0, cap);

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <span style={{ color: "var(--purple-agent)", display: "inline-flex" }}>
              <Icon name="brain" size={14} />
            </span>
            <span>Autonomous Agent Decision Stream</span>
          </div>
          <div className="card-subtitle">Plain-language reasoning &amp; state coordination</div>
        </div>
        <span
          style={{
            fontSize: 10,
            background: "#f1f5f9",
            padding: "2px 6px",
            borderRadius: 4,
            fontFamily: "monospace",
          }}
        >
          6 Agents Active
        </span>
      </div>
      <div className="card-body">
        <div className="transcript-stream">
          {hasInjection ? <InjectionCard lastInjection={lastInjection} /> : null}
          {entries.length === 0 && !hasInjection ? (
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Start simulation — agent reasoning appears here after the first tick.
            </div>
          ) : (
            entries.map((e, i) => {
              const key = String(e?.agent ?? "unknown");
              const meta = AGENT_META[key];
              const label = meta?.label ?? key;
              const tag = meta?.tag ?? "";
              const tick = Number(e?.tick ?? 0);
              const body = e?.rationale || e?.action || "—";
              return (
                <div key={`${key}-${tick}-${i}`} className="agent-card">
                  <div className="agent-header">
                    <span
                      className={`agent-name ${tag}`}
                      style={{ padding: "2px 8px", borderRadius: 4 }}
                    >
                      {meta ? (
                        <Icon name={meta.icon} size={12} />
                      ) : null}
                      {label}
                    </span>
                    <span className="agent-time">{tickClock(tick)}</span>
                  </div>
                  <div className="agent-reasoning">{body}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default AgentStreamPanel;
