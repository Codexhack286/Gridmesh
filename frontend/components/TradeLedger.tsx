export function TradeLedger({ trades }: { trades: any[] }) {
  return (
    <div>
      <h3>Trade ledger</h3>
      <ul>
        {(trades ?? []).map((t: any) => (
          <li key={t.index ?? `${t.tick}-${t.seller_id}-${t.buyer_id}`}>
            tick {t.tick}: {t.seller_id} → {t.buyer_id} {t.qty_kwh} kWh @ {t.clearing_price}
          </li>
        ))}
      </ul>
    </div>
  );
}
