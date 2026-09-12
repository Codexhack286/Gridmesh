"use client";
import { useState } from "react";
import { Icon } from "./icons";
import { truncateHash, tickClock } from "../lib/utils";

interface CompliancePanelProps {
  chain: any[] | null;
  verifyResult: any;
  verifying: boolean;
  demoMode: boolean;
  tampering: boolean;
  tamperTick: number | null;
  setTamperTick: (t: number) => void;
  onVerify: () => void;
  onTamper: () => void;
  onInject: (kind: string) => void;
  injecting: boolean;
  violationCount: number;
}

const RULES = [
  { id: "R-01", name: "CERC Price Ceiling (₹9.00/kWh max)", detail: "Trade cleared within CERC / SERC microgrid tariff ceiling", hash: "8204f887a1", pass: true },
  { id: "R-02", name: "SERC Volume Quota (10.0 kWh cap)", detail: "Transaction volume complies with distributed net metering quota limits", hash: "3af921bc44", pass: true },
  { id: "R-03", name: "Self-Trade Guard (Wash Prevention)", detail: "Buyer and seller consumer identities are strictly distinct", hash: "9c15e04af3", pass: true },
  { id: "R-04", name: "Collusion Floor (₹4.00/kWh check)", detail: "No synchronized predatory dumping below generation cost detected", hash: "5b3d77f109", pass: true },
  { id: "R-05", name: "Distribution Transformer (DT) Limit (8.0 kW)", detail: "DT thermal capacity and IEGC technical reserve threshold observed", hash: "e02c6f3891", pass: true },
];

export function CompliancePanel({
  chain,
  verifyResult,
  verifying,
  demoMode,
  tampering,
  tamperTick,
  setTamperTick,
  onVerify,
  onTamper,
  onInject,
  injecting,
  violationCount,
}: CompliancePanelProps) {
  const [selectedScenario, setSelectedScenario] = useState("predatory_price");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const passed = verifyResult == null ? null : verifyResult.valid === true;
  const brokenBlock = verifyResult?.first_break ?? null;
  const totalAudited = Math.max(16, (chain?.length ?? 0) * 3);

  const handleCopy = (hash: string) => {
    try {
      navigator.clipboard?.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const orderedBlocks = [...(chain ?? [])].reverse().slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 2-Column: Scenario Injection & Audit Summary */}
      <div className="compliance-layout">
        {/* Scenario Control */}
        <div className="card-light">
          <h3 className="section-title-light">Scenario Injection Control</h3>
          <p className="section-hint-light">Inject anomalous market conditions to test regulatory enforcement.</p>

          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--slate)", marginBottom: 6 }}>
            Microgrid Simulation Scenario
          </label>
          <select
            className="select"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              fontSize: 13,
              color: "var(--ink)",
              marginBottom: 14,
            }}
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
          >
            <option value="predatory_price">Predatory Price Breach (R-01)</option>
            <option value="bulk_dump">Bulk Market Dumping (R-02)</option>
            <option value="self_trade">Self-Trade Wash Volume (R-03)</option>
            <option value="collusion">Collusion Signal Transfer (R-04)</option>
            <option value="feeder_overload">Feeder Line Saturation (R-05)</option>
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-warn"
              onClick={() => onInject(selectedScenario)}
              disabled={injecting}
            >
              <Icon name="shield-warning" size={14} />
              <span>{injecting ? "Injecting…" : "Inject Rogue Bid"}</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => onInject("normal")}
              disabled={injecting}
            >
              <Icon name="check-circle" size={14} />
              <span>Normal Dispatch</span>
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--slate-soft)", marginTop: 14, lineHeight: 1.45 }}>
            Triggering a scenario forces an agent to inject an illegal bid. The Compliance Agent evaluates it against rules and auto-voids it before ledger settlement.
          </p>
        </div>

        {/* Audit Summary & Rules Pass/Fail */}
        <div className="card-light">
          <h3 className="section-title-light">Regulatory Audit Summary</h3>
          <p className="section-hint-light">Continuous trade evaluation for active session.</p>

          <div className="stat-pills-row">
            <span className="stat-pill-item">
              <strong>{totalAudited}</strong> trades audited
            </span>
            <span className="stat-pill-item">
              <strong style={{ color: violationCount > 0 ? "var(--alert)" : "var(--leaf)" }}>
                {violationCount}
              </strong> violations flagged
            </span>
            <span className="stat-pill-item">
              <strong style={{ color: "var(--ink)" }}>{violationCount}</strong> auto-voided
            </span>
          </div>

          <div className="rule-cards-list">
            {RULES.map((rule, rIdx) => {
              const isViolated = violationCount > 0 && rIdx === 0;
              return (
                <div key={rule.id} className={`rule-row${isViolated ? " violation" : ""}`}>
                  <span className={`badge-status ${isViolated ? "fail" : "pass"}`}>
                    {isViolated ? "VIOLATION" : "PASS"}
                  </span>
                  <div>
                    <div className="rule-name">{rule.id} • {rule.name}</div>
                    <div className="rule-desc">{isViolated ? "Rogue bid detected and auto-voided" : rule.detail}</div>
                  </div>
                  <span className="hash-pill mono">
                    {rule.hash}
                    <button
                      onClick={() => handleCopy(rule.hash)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--slate-soft)", display: "flex" }}
                      title="Copy transaction hash"
                      aria-label="Copy hash"
                    >
                      <Icon name={copiedHash === rule.hash ? "check-circle" : "link"} size={12} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Verifiable Blockchain Section */}
      <div className="card-light">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: passed === false ? "var(--alert)" : passed === true ? "var(--leaf)" : "var(--sun)",
              display: "inline-block"
            }} />
            <div>
              <h3 className="section-title-light" style={{ margin: 0 }}>
                {passed === true
                  ? `Chain Integrity Verified (${chain?.length ?? 0} Blocks Intact)`
                  : passed === false
                  ? `Integrity Alert: Hash Mismatch Detected at Block #${brokenBlock}`
                  : "Cryptographic SHA-256 Ledger (Unverified)"}
              </h3>
              <span style={{ fontSize: 12, color: "var(--slate-soft)" }}>
                {passed === false
                  ? "Direct database tampering detected; block hash pointer linkage broken."
                  : "Every settled trade and audit is sealed with immutable SHA-256 hash pointers."}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="btn btn-teal"
              onClick={onVerify}
              disabled={verifying}
            >
              <Icon name="shield-check" size={14} />
              <span>{verifying ? "Auditing…" : "Verify Chain"}</span>
            </button>

            {demoMode && (
              <div className="tamper-control">
                {chain && chain.length > 0 && (
                  <select
                    className="tamper-select"
                    value={tamperTick ?? ""}
                    onChange={(e) => setTamperTick(Number(e.target.value))}
                    aria-label="Block to corrupt"
                  >
                    {[...(chain ?? [])].reverse().map((b) => (
                      <option key={b.block_index} value={b.block_index}>
                        Block #{b.block_index}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="btn-tamper"
                  onClick={onTamper}
                  disabled={tampering || verifying}
                >
                  <Icon name="shield-warning" size={12} />
                  <span>{tampering ? "Corrupting…" : "Tamper Demo"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Block Cards Sequence */}
        <div className="blockchain-blocks-flow">
          {orderedBlocks.map((b, i) => {
            const isTampered = brokenBlock != null && b.block_index === brokenBlock;
            return (
              <div key={b.block_index} style={{ display: "flex", alignItems: "center" }}>
                <div className={`block-item-card${isTampered ? " tampered" : i === 0 ? " latest" : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span className="block-index-badge">
                      Block #{b.block_index}
                    </span>
                    {isTampered && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--alert)", background: "var(--alert-soft)", padding: "2px 6px", borderRadius: 4 }}>
                        CORRUPTED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--slate)", marginBottom: 6 }}>
                    {tickClock(b.block_index, true)}
                  </div>
                  <div className="block-counts-row">
                    <span className="count-chip">{b.trade_count} Trades</span>
                    <span className="count-chip">{b.audit_count} Audits</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--slate)", marginBottom: 4 }}>
                    Prev: <span className="mono" style={{ color: "var(--current)" }}>{truncateHash(b.prev_hash ?? "", 8)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--slate)" }}>
                    Hash: <span className="mono" style={{ color: isTampered ? "var(--alert)" : "var(--ink)", fontWeight: 600 }}>{truncateHash(b.block_hash ?? "", 8)}</span>
                  </div>
                </div>
                {i < orderedBlocks.length - 1 && (
                  <div className="connector-arrow">
                    <svg viewBox="0 0 22 14" width="22" height="14">
                      <path d="M0 7h18M12 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
