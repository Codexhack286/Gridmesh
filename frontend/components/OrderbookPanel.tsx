"use client";
import { Icon } from "./icons";

export function tickClock(tick: number): string {
  const mins = (((tick % 96) + 96) % 96) * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

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
  const grid = Number(community.grid_price_reference_usd ?? 0.3);
  const p2pAvg = Number(community.p2p_avg_price_usd ?? 0.255);
  const orderPriceCents = ((Number(community.p2p_avg_price_usd ?? 0.255)) * 100).toFixed(1);

  const asks = decisions.filter(
    (d) => String(d?.action).toLowerCase() === "sell" && Number(d?.qty_kwh) > 0
  );
  const bids = decisions.filter(
    (d) => String(d?.action).toLowerCase() === "buy" && Number(d?.qty_kwh) > 0
  );
  const rows = [...asks, ...bids];

  const byIndex = new Map<number, Trade>();
  for (const t of [...history, ...currentTrades]) {
    if (t && typeof t.index === "number") byIndex.set(t.index, t);
  }
  const ticker = [...byIndex.values()].sort((a, b) => b.index - a.index).slice(0, 12);

  const hasClears = currentTrades.length > 0;

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <Icon name="handshake" size={14} />
          <span>P2P Energy Marketplace</span>
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
                    <td>{orderPriceCents}¢</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 12, fontSize: 11, marginBottom: 12 }}>
          <span>
            Grid Retail Rate{" "}
            <strong className="mono" style={{ color: "#ef4444" }}>
              {(grid * 100).toFixed(1)}¢/kWh
            </strong>
          </span>
          <span>
            P2P Clearing{" "}
            <strong className="mono" style={{ color: "#0284c7" }}>
              {(p2pAvg * 100).toFixed(1)}¢/kWh
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
              const savings = (grid - p2pAvg) * Number(t.qty_kwh ?? 0);
              const savingsLabel =
                savings >= 0 ? `+$${savings.toFixed(2)}` : `-$${Math.abs(savings).toFixed(2)}`;
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
                      {Number(t.qty_kwh).toFixed(2)} kWh @ {(Number(t.clearing_price) * 100).toFixed(1)}
                      ¢/kWh · {tickClock(Number(t.tick ?? 0))}
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
          CO₂ Avoided {Number(community.co2_avoided_kg ?? 0).toFixed(1)} kg · Community Savings $
          {Number(community.financial_savings_usd ?? 0).toFixed(2)} ·{" "}
          {Number(community.total_kwh_traded ?? 0).toFixed(2)} kWh traded
        </div>
      </div>
    </section>
  );
}

export default OrderbookPanel;
