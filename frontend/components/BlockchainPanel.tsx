"use client";

/* Blockchain centerpiece: the hash chain as a visual sequence, a
   pass/fail VERIFY state (green/red strip, same treatment as the
   topology status strip), and — demo mode only — a tamper test that
   re-verifies and highlights the exact broken block.

   The tamper section is conditionally rendered ONLY when demoMode is
   true (early `return null` fragment below): with demo mode off it is
   absent from the DOM entirely, never merely disabled.
*/

export interface ChainBlock {
  block_index: number;
  prev_hash: string;
  block_hash: string;
  trade_count: number;
  audit_count: number;
}

export function BlockchainPanel({
  chain,
  verifyResult,
  demoMode,
  verifying,
  tampering,
  tamperTick,
  setTamperTick,
  onVerify,
  onTamper,
}: {
  chain: ChainBlock[] | null;
  verifyResult: any;
  demoMode: boolean;
  verifying: boolean;
  tampering: boolean;
  tamperTick: number | null;
  setTamperTick: (t: number) => void;
  onVerify: () => void;
  onTamper: () => void;
}) {
  const broken: number | null = verifyResult?.first_break ?? null;
  const passed: boolean | null = verifyResult == null ? null : verifyResult.valid === true;
  const ordered = [...(chain ?? [])].reverse();

  return (
    <div>
      <h3>Blockchain</h3>
      <div className={passed == null ? "verify-strip" : passed ? "verify-strip verify-pass" : "verify-strip verify-fail"}>
        <div className={passed == null ? "status-dot" : passed ? "status-dot dot-ok" : "status-dot dot-bad"} />
        <div className="status-text">
          {passed == null ? "Chain not verified yet" : passed ? `Chain verified — ${verifyResult.block_count} blocks intact` : `Chain BROKEN at block ${broken}`}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={onVerify} disabled={verifying}>
            {verifying ? "verifying…" : "Verify chain"}
          </button>
        </div>
      </div>

      <div className="chain-seq" aria-label="Block sequence, oldest to newest">
        {(ordered ?? []).map((b) => (
          <span key={b.block_index} className="chain-link-wrap">
            <span
              className={b.block_index === broken ? "chain-block chain-broken" : "chain-block"}
              title={`prev ${b.prev_hash}\nhash ${b.block_hash}`}
            >
              <b className="mono">#{b.block_index}</b>
              <span className="mono chain-hash">{b.block_hash.slice(0, 12)}…</span>
              <span className="chain-counts">
                {b.trade_count}T/{b.audit_count}A
              </span>
            </span>
            <span className="chain-arrow" aria-hidden="true">
              →
            </span>
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        Each block&apos;s line into the next is its <span className="mono">prev_hash → block_hash</span> link; break the
        link and verify fails at exactly that block.
      </p>

      {demoMode ? (
        <div className="tamper-box">
          <label>
            Tamper test — corrupt tick{" "}
            <select
              value={tamperTick ?? ""}
              onChange={(e) => setTamperTick(Number(e.target.value))}
              aria-label="Block to tamper"
            >
              {(ordered ?? []).map((b) => (
                <option key={b.block_index} value={b.block_index}>
                  #{b.block_index} ({b.trade_count}T/{b.audit_count}A)
                </option>
              ))}
            </select>
          </label>{" "}
          <button onClick={onTamper} disabled={tampering || tamperTick == null}>
            {tampering ? "tampering…" : "Tamper test"}
          </button>
          <span style={{ fontSize: 12, opacity: 0.75 }}>demo mode: corrupts via raw SQL, then re-verifies</span>
        </div>
      ) : null}
    </div>
  );
}
