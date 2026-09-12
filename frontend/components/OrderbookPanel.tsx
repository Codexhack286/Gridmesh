"use client";
import { Icon } from "./icons";

import { tickClock, INDIA_GRID_TARIFF_INR, INDIA_P2P_CLEARING_INR, formatINR } from "../lib/utils";
export { tickClock };

const LABELS: Record<string, string> = {
  solar_home: "Solar Home",
  household: "Household",
  commercial: "Commercial Solar",
  ev_station: "EV Charging Hub",
  battery_site: "Community BESS",
};

function labelFor(pid: string): string {
  return LABELS[pid] ?? pid;
}

interface Trade {
  index: number;
  id?: number;
  tick: number;
  buyer_id: string;
  seller_id: string;
  qty_kwh: number;
  clearing_price: number;
  rationale?: string;
}

export function OrderbookPanel({
  data,
  reports,
  tradesHistory,
}: {
  data: any | null;
  reports: any | null;
  tradesHistory: any[];
}) {
  const decisions: any[] = Array.isArray(data?.decisions) ? data.decisions : [];
  const currentTrades: Trade[] = Array.isArray(data?.trades) ? data.trades : [];
  const history: Trade[] = Array.isArray(tradesHistory) ? tradesHistory : [];

  const community = reports?.community ?? {};
  const gridInr = INDIA_GRID_TARIFF_INR;
  const p2pAvgInr = INDIA_P2P_CLEARING_INR;

  const asks = decisions.filter(
    (d) => String(d?.action).toLowerCase() === "sell" && Number(d?.qty_kwh) > 0
  );
  const bids = decisions.filter(
    (d) => String(d?.action).toLowerCase() === "buy" && Number(d?.qty_kwh) > 0
  );
  const rows = [...asks, ...bids];

  const byIndex = new Map<number, Trade>();
  for (const t of [...history, ...currentTrades]) {
    const key = typeof t?.index === "number" ? t.index : (t as any)?.id;
    if (t && typeof key === "number") byIndex.set(key, { ...t, index: key });
  }
  const ticker = [...byIndex.values()].sort((a, b) => b.index - a.index).slice(0, 12);

  const hasClears = currentTrades.length > 0;
  const totalTradedKwh = Number(community.total_kwh_traded ?? 0);
  const totalSavingsInr = totalTradedKwh * (gridInr - p2pAvgInr);
  const co2AvoidedKg = totalTradedKwh * 0.716;

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <Icon name="handshake" size={14} />
          <span>P2P Energy Marketplace (Indian Grid)</span>
        </div>
        {hasClears ? (
          <span className="trade-badge badge-cleared">Active Clearing</span>
        ) : (
          <span className="trade-badge">No Clears Yet</span>
        )}
      </div>
      <div className="card-body">
        <table className="orderbook-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Participant</th>
              <th>kWh</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>no orders this tick</td>
              </tr>
            ) : (
              rows.map((d, i) => {
                const isSell = String(d?.action).toLowerCase() === "sell";
                const pid = String(d?.participant_id ?? "—");
                return (
                  <tr key={`${pid}-${i}`} className={isSell ? "trade-row-sell" : "trade-row-buy"}>
                    <td>{isSell ? "ASK" : "BID"}</td>
                    <td>{labelFor(pid)}</td>
                    <td>{Number(d?.qty_kwh).toFixed(2)}</td>
                    <td>₹{p2pAvgInr.toFixed(2)}/u</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 14, fontSize: 11.5, marginBottom: 12 }}>
          <span>
            DISCOM Retail Rate:{" "}
            <strong className="mono" style={{ color: "#ef4444" }}>
              ₹{gridInr.toFixed(2)}/kWh
            </strong>
          </span>
          <span>
            P2P Clearing:{" "}
            <strong className="mono" style={{ color: "#0284c7" }}>
              ₹{p2pAvgInr.toFixed(2)}/kWh
            </strong>
          </span>
        </div>

        <div className="trade-ticker">
          {ticker.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              No trades cleared yet — start the simulation.
            </div>
          ) : (
            ticker.map((t) => {
              const qty = Number(t.qty_kwh ?? 0);
              const savings = (gridInr - p2pAvgInr) * qty;
              const savingsLabel = savings >= 0 ? `+${formatINR(savings)}` : `-${formatINR(Math.abs(savings))}`;
              return (
                <div key={t.index} className="trade-item">
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="trade-badge badge-cleared">TR-{t.index}</span>
                      <span>
                        {labelFor(String(t.seller_id))} → {labelFor(String(t.buyer_id))}
                      </span>
                    </div>
                    <div className="mono" style={{ color: "var(--text-secondary)" }}>
                      {qty.toFixed(2)} kWh @ ₹{p2pAvgInr.toFixed(2)}/kWh · {tickClock(Number(t.tick ?? 0))}
                    </div>
                  </div>
                  <div className="mono" style={{ color: "#047857", fontWeight: 700 }}>
                    {savingsLabel}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 8,
            marginTop: 8,
          }}
        >
          CO₂ Avoided: {co2AvoidedKg.toFixed(1)} kg (CEA India 0.716 kg/kWh) · Community Savings:{" "}
          {formatINR(totalSavingsInr)} · {totalTradedKwh.toFixed(2)} kWh traded
        </div>
      </div>
    </section>
  );
}

export default OrderbookPanel;
