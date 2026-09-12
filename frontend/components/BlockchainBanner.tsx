"use client";
import { useState } from "react";
import { Icon } from "./icons";
import { truncateHash } from "../lib/utils";

export interface ChainBlock {
  block_index: number;
  prev_hash: string;
  block_hash: string;
  trade_count: number;
  audit_count: number;
}

export function BlockchainBanner({
  chain,
  verifyResult,
  verifying,
  demoMode = false,
  tampering = false,
  tamperTick = null,
  setTamperTick,
  onVerify,
  onTamper,
}: {
  chain: ChainBlock[] | null;
  verifyResult: any;
  verifying: boolean;
  demoMode?: boolean;
  tampering?: boolean;
  tamperTick?: number | null;
  setTamperTick?: (t: number) => void;
  onVerify: () => void;
  onTamper?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const ordered = [...(chain ?? [])].reverse().slice(0, 12);
  const latest = chain && chain.length > 0 ? Math.max(...chain.map((b) => b.block_index)) : null;
  const passed: boolean | null = verifyResult == null ? null : verifyResult.valid === true;
  const brokenBlock = verifyResult?.first_break ?? null;
  const blockCount = verifyResult?.block_count ?? chain?.length ?? 0;

  return (
    <div className="blockchain-banner">
      <div className="blockchain-header" onClick={() => setOpen((o) => !o)} role="button" aria-expanded={open}>
        <div className="blockchain-title">
          <Icon name={open ? "caret-down" : "caret-right"} size={14} />
          <Icon name="link" size={16} />
          <span>Verifiable Settlement Ledger</span>
          <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>
            Cryptographic SHA-256 Hash Chain
          </span>
          {demoMode && (
            <span style={{ fontSize: 10, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>
              Demo Mode Active
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-secondary)" }}>
          <span>
            Latest Block: <strong>{latest != null ? `#${latest}` : "#—"}</strong>
          </span>
          <button
            className="btn btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              onVerify();
            }}
            disabled={verifying}
            title="Verify SHA-256 cryptographic linkage across all blocks"
          >
            {verifying ? "Verifying…" : "Verify Chain"}
          </button>
          {(demoMode || onTamper) && onTamper && (
            <div className="tamper-control" onClick={(e) => e.stopPropagation()}>
              {setTamperTick && chain && chain.length > 0 && (
                <select
                  className="tamper-select"
                  value={tamperTick ?? ""}
                  onChange={(e) => setTamperTick(Number(e.target.value))}
                  aria-label="Select block to corrupt for tamper demonstration"
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
                onClick={(e) => {
                  e.stopPropagation();
                  onTamper();
                }}
                disabled={tampering || verifying}
                title="Directly corrupt SQLite database record to demonstrate cryptographic tamper detection"
              >
                <Icon name="shield-warning" size={12} />
                <span>{tampering ? "Tampering…" : "Tamper Demo"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {passed === true ? (
        <div style={{ padding: "8px 18px", fontSize: 12, color: "#065f46", background: "var(--green-light)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="shield-check" size={14} />
          <span><strong>Chain Verified:</strong> All {blockCount} blocks intact with valid cryptographic SHA-256 hash pointers.</span>
        </div>
      ) : passed === false ? (
        <div style={{ padding: "8px 18px", fontSize: 12, color: "#991b1b", background: "#fee2e2", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="shield-warning" size={14} />
          <span><strong>TAMPER DETECTED:</strong> Chain integrity check failed — hash mismatch at block #{brokenBlock}. Record was modified!</span>
        </div>
      ) : null}
      {open && ordered.length > 0 ? (
        <div className="blocks-stream">
          {ordered.map((b, i) => {
            const isTampered = brokenBlock != null && b.block_index === brokenBlock;
            const isLatest = i === 0 && !isTampered;
            return (
              <div
                key={b.block_index}
                className={`block-card${isTampered ? " tampered" : isLatest ? " latest" : ""}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Block #{b.block_index} {isTampered ? "⚠️ CORRUPT" : ""}</strong>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>
                    {b.trade_count} trades / {b.audit_count} audits
                  </span>
                </div>
                <div>
                  Prev Hash: <span className="hash-val">{truncateHash(b.prev_hash ?? "")}</span>
                </div>
                <div>
                  Block Hash: <span className="hash-val">{truncateHash(b.block_hash ?? "")}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
