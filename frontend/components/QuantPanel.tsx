"use client";

/* Quant Core panel — HONEST PENDING STATE ONLY. The XGBoost model is not
   trained. Nothing here may display a number, chart, or prediction as model
   output. The only numbers shown are explicitly labeled rule-based-tier
   figures (the live fallback), and the model-output area renders solely when
   /api/quant/status reports a trained state (code path present, unreachable
   today — verified by the pending status response).
*/

const FALLBACK_BLURB =
  "Live pricing today is rule-based tiers: prosumer Tier 0–4 decisions " +
  "(dispatch override → deficit buy → below-threshold charge → " +
  "above-threshold sell capped to surplus → idle), fixed 0.255 $/kWh " +
  "clearing (15% below the 0.30 grid benchmark), seasonal-naive forecasts.";

export function QuantPanel({ status }: { status: any }) {
  const trained = status != null && status.status !== null && status.status !== undefined && status.status !== "pending_training";

  return (
    <div className="quant-pending">
      <h3>
        Quant Core{" "}
        <span className="quant-badge">{status == null ? "status unknown" : status.status === "pending_training" ? "Model training in progress" : `Model ${status.status}`}</span>
      </h3>
      <p style={{ fontSize: 13 }}>
        XGBoost pricing/forecasting model{status?.last_updated ? ` (updated ${status.last_updated})` : " — not trained yet"}. Current live
        fallback: <b>{status?.fallback ?? "rule_based_tiers"}</b>.
      </p>
      <p style={{ fontSize: 12.5, opacity: 0.85 }}>{FALLBACK_BLURB}</p>
      {trained ? (
        <div className="quant-output">
          <p>Model output would render here (status: {String(status.status)}).</p>
        </div>
      ) : (
        <div className="quant-placeholder" aria-label="Model output placeholder">
          Model output appears here once <span className="mono">/api/quant/status</span> reports a trained state — no
          predictions are shown until then.
        </div>
      )}
    </div>
  );
}
