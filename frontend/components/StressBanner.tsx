export function StressBanner({ stress }: { stress: any }) {
  if (!stress || Object.keys(stress).length === 0) return null;
  const demand = stress.aggregate_demand_kw ?? 0;
  const hot = demand >= (stress.threshold_kw ?? Infinity);
  return (
    <div style={{ padding: 12, background: hot ? "#7f1d1d" : "#14532d", color: "white" }}>
      {hot ? "GRID STRESS" : "Grid normal"} — {demand} kW
      <div style={{ fontSize: 12 }}>{stress.rationale}</div>
    </div>
  );
}
