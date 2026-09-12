"use client";

import { useState } from "react";

/* Compliance & Audit panel: makes Fix 2's restart-persistence visible.
   - Live audit count + latest hash come from GET /api/blockchain/status
     (SQLite, durable across restarts).
   - "Since restart" badge derives from server_started_at: restarting the
     backend moves the timestamp while the count stays put — the demo proof.
   - Rogue-bid button hits POST /api/scenario/rogue_bid and shows the
     returned flag / rationale / audit hash immediately.
   - "Persistence check" re-fetches status and prints count + timestamp side
     by side for the restart comparison.
*/

export interface ChainStatus {
  server_started_at: string;
  audit_count: number;
  latest_audit_hash: string | null;
  demo_mode: boolean;
}

export interface InjectionResult {
  scenario: string;
  audits: Array<{
    rule_id: string;
    flag: string;
    rationale: string;
    audit_hash?: string;
  }>;
}

export function CompliancePanel({
  status,
  lastInjection,
  checkedAt,
  onInject,
  onCheck,
  injecting,
}: {
  status: ChainStatus | null;
  lastInjection: InjectionResult | null;
  checkedAt: string | null;
  onInject: (kind: string) => void;
  onCheck: () => void;
  injecting: boolean;
}) {
  const [kind, setKind] = useState("predatory_price");

  return (
    <div>
      <h3>Compliance &amp; Audit</h3>
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        Persisted audits (SQLite): <b className="mono">{status?.audit_count ?? "—"}</b>
        {" · "}latest hash: <span className="mono">{status?.latest_audit_hash ?? "—"}</span>
      </p>
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        Server started: <span className="mono">{status?.server_started_at ?? "—"}</span>{" "}
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            border: "1px solid currentColor",
            borderRadius: 4,
            padding: "1px 6px",
            marginLeft: 6,
          }}
        >
          since last restart
        </span>
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Rogue-bid scenario">
          <option value="predatory_price">predatory_price (R-01)</option>
          <option value="bulk_dump">bulk_dump (R-02/R-05)</option>
          <option value="self_trade">self_trade (R-03)</option>
          <option value="collusion">collusion (R-04)</option>
          <option value="feeder_overload">feeder_overload (R-05)</option>
        </select>
        <button onClick={() => onInject(kind)} disabled={injecting}>
          {injecting ? "injecting…" : "Inject rogue bid"}
        </button>
        <button onClick={onCheck}>Persistence check</button>
      </div>
      {lastInjection && (
        <ul>
          {(lastInjection.audits ?? []).map((a, i) => (
            <li key={i}>
              <b>
                [{a.rule_id}] {a.flag}
              </b>{" "}
              — <i>{a.rationale}</i> <span className="mono">hash {a.audit_hash ?? "—"}</span>
            </li>
          ))}
        </ul>
      )}
      {checkedAt && (
        <p style={{ fontSize: 12, opacity: 0.75 }}>
          Last persistence check at <span className="mono">{checkedAt}</span>: count{" "}
          <b className="mono">{status?.audit_count ?? "—"}</b> as of{" "}
          <span className="mono">{status?.server_started_at ?? "—"}</span>
        </p>
      )}
    </div>
  );
}
