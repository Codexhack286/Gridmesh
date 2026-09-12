"use client";
import { useState } from "react";
import { Icon } from "./icons";

export interface ChainBlock {
  block_index: number;
  prev_hash: string;
  block_hash: string;
  trade_count: number;
  audit_count: number;
}

function truncateHash(h: string): string {
  return h.length > 10 ? `${h.slice(0, 10)}…` : h;
}

export function BlockchainBanner({
  chain,
  verifyResult,
  verifying,
  onVerify,
}: {
  chain: ChainBlock[] | null;
  verifyResult: any;
  verifying: boolean;
  onVerify: () => void;
}) {
  const [open, setOpen] = useState(true);
  const ordered = [...(chain ?? [])].reverse().slice(0, 10);
  const latest = chain && chain.length > 0 ? Math.max(...chain.map((b) => b.block_index)) : null;
  const passed: boolean | null = verifyResult == null ? null : verifyResult.valid === true;
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
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-secondary)" }}>
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
          >
            {verifying ? "verifying…" : "Verify chain"}
          </button>
        </div>
      </div>
      {passed === true ? (
        <div style={{ padding: "8px 18px", fontSize: 12, color: "#065f46", background: "var(--green-light)" }}>
          Chain verified — {blockCount} blocks intact
        </div>
      ) : passed === false ? (
        <div style={{ padding: "8px 18px", fontSize: 12, color: "#991b1b", background: "var(--red-light)" }}>
          Chain BROKEN at block {verifyResult.first_break}
        </div>
      ) : null}
      {open && ordered.length > 0 ? (
        <div className="blocks-stream">
          {ordered.map((b, i) => (
            <div key={b.block_index} className={i === 0 ? "block-card latest" : "block-card"}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Block #{b.block_index}</strong>
                <span>
                  {b.trade_count}T/{b.audit_count}A
                </span>
              </div>
              <div>
                Prev Hash: <span className="hash-val">{truncateHash(b.prev_hash ?? "")}</span>
              </div>
              <div>
                Payload: {b.trade_count} trade(s), {b.audit_count} audit(s)
              </div>
              <div>
                Block Hash: <span className="hash-val">{truncateHash(b.block_hash ?? "")}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
