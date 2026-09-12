"use client";

/* Topology hero: five participants ringed around the central feeder.
   Visual language follows the simulation.html prototype (CSS custom
   properties, SOC ring arcs, animated flow-line classes, status strip)
   but every value below comes from a live POST /tick response — there is
   no scripted ticks array and no fake stat accumulator in this file.

   Field mapping from the real tick response (see F1 field diff):
   - decisions[].action        -> action chip + flow-line class
   - decisions[].battery_soc_pct -> SOC ring fill + numeric label
   - battery_states[].reserve_floor_pct -> floor marker arc + "floor X%" label
   - stress.aggregate_demand_kw / threshold_kw -> status strip + hub readout
   - trades[]                  -> per-tick clears (rendered by TradeLedger)
*/

export interface TickDecision {
  participant_id: string;
  action: string;
  battery_soc_pct: number;
  battery_action: string;
  qty_kwh: number;
  rationale: string;
}

export interface BatteryState {
  participant_id: string;
  battery_soc_pct: number;
  battery_action: string;
  preference_applied: string;
  reserve_floor_pct?: number;
}

export interface TickStress {
  aggregate_demand_kw: number;
  threshold_kw: number;
  rationale: string;
}

const NODE_LAYOUT: Record<string, { label: string; angle: number }> = {
  solar_home: { label: "Solar Home", angle: -125 },
  household: { label: "Household", angle: -35 },
  commercial: { label: "Commercial", angle: 35 },
  ev_station: { label: "EV Station", angle: 125 },
  battery_site: { label: "Battery Site", angle: 180 },
};

const CX = 580;
const CY = 200;
const RING_R = 24;
const CIRC = 2 * Math.PI * RING_R;

function nodePos(angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + 300 * Math.cos(a) * 0.62, y: CY + 300 * Math.sin(a) * 0.62 };
}

function labelFor(pid: string): string {
  return (
    NODE_LAYOUT[pid]?.label ??
    pid
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function flowClass(action: string, batteryAction: string): string {
  if (batteryAction === "discharge" || action === "discharge") return "active-discharge";
  if (action === "sell") return "active-sell";
  if (action === "buy" || action === "charge" || action === "store") return "active-buy";
  return "";
}

const CHIP_TEXT: Record<string, string> = {
  sell: "SELL",
  buy: "BUY",
  store: "STORE",
  charge: "CHARGE",
  discharge: "DISCHARGE",
  throttle: "THROTTLE",
  consume: "",
};

const CHIP_COLOR: Record<string, string> = {
  sell: "var(--solar)",
  buy: "var(--flow)",
  store: "var(--battery)",
  charge: "var(--battery)",
  discharge: "var(--stress)",
  throttle: "var(--stress)",
};

/** HH:MM derived from the tick index (96 fifteen-minute ticks per day). */
export function tickClock(tick: number): string {
  const mins = ((tick % 96) + 96) % 96 * 15;
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function Topology({
  tick,
  decisions,
  batteryStates,
  stress,
}: {
  tick: number;
  decisions: TickDecision[];
  batteryStates: BatteryState[];
  stress: TickStress;
}) {
  const byId = new Map(decisions.map((d) => [d.participant_id, d]));
  const floorById = new Map(batteryStates.map((b) => [b.participant_id, b.reserve_floor_pct ?? 20]));
  const agg = stress?.aggregate_demand_kw ?? 0;
  const threshold = stress?.threshold_kw ?? 6.0;
  const stressed = agg >= threshold;
  const ids = decisions.length > 0 ? decisions.map((d) => d.participant_id) : batteryStates.map((b) => b.participant_id);

  return (
    <div>
      <div className={stressed ? "status-strip stressed" : "status-strip"}>
        <div className="status-dot" />
        <div className="status-text">{stressed ? `Grid stress — ${agg.toFixed(2)} kW` : `Grid normal — ${agg.toFixed(2)} kW`}</div>
        <div className="status-detail">
          threshold <b>{threshold.toFixed(2)}</b> kW &nbsp;·&nbsp; aggregate <b>{agg.toFixed(2)}</b> kW
        </div>
      </div>

      <div className="topology">
        <svg className="grid-svg" viewBox="0 0 1160 400" role="img" aria-label="Live microgrid topology">
          <g>
            {ids.map((pid) => {
              const angle = NODE_LAYOUT[pid]?.angle ?? 0;
              const pos = nodePos(angle);
              const d = byId.get(pid);
              const cls = flowClass(d?.action ?? "", d?.battery_action ?? "");
              return <path key={pid} d={`M ${pos.x} ${pos.y} L ${CX} ${CY}`} className={cls ? `flow-line ${cls}` : "flow-line"} />;
            })}
          </g>
          <g transform={`translate(${CX},${CY})`}>
            <circle className="hub-core" r="30" />
            <text className="hub-label" textAnchor="middle" y="-2">
              FEEDER
            </text>
            <text className="hub-sub" textAnchor="middle" y="14">
              {agg.toFixed(2)} kW
            </text>
          </g>
          <g>
            {ids.map((pid) => {
              const angle = NODE_LAYOUT[pid]?.angle ?? 0;
              const pos = nodePos(angle);
              const d = byId.get(pid);
              const soc = d?.battery_soc_pct ?? 0;
              const floor = floorById.get(pid) ?? 20;
              const action = d?.action ?? "";
              const socOffset = CIRC * (1 - Math.min(100, Math.max(0, soc)) / 100);
              const floorOffset = CIRC * (1 - Math.min(100, Math.max(0, floor)) / 100);
              const below = pos.y > CY;
              return (
                <g key={pid} transform={`translate(${pos.x},${pos.y})`}>
                  <circle className="node-ring-bg" r={RING_R} />
                  <circle
                    className="node-ring-fg"
                    r={RING_R}
                    stroke={soc < 25 ? "var(--stress)" : "var(--battery)"}
                    strokeWidth={3}
                    strokeDasharray={CIRC.toFixed(1)}
                    strokeDashoffset={socOffset.toFixed(1)}
                    transform="rotate(-90)"
                  />
                  {/* reserve-floor marker: short arc tick at the floor position — always visible */}
                  <circle
                    className="node-floor-tick"
                    r={RING_R}
                    stroke="var(--solar)"
                    strokeWidth={4}
                    strokeDasharray={`5 ${CIRC.toFixed(1)}`}
                    strokeDashoffset={floorOffset.toFixed(1)}
                    transform="rotate(-90)"
                  />
                  <circle className="node-core" r={19} fill="#131824" />
                  <text className="action-chip" textAnchor="middle" y={4} fill={CHIP_COLOR[action] ?? "var(--text-secondary)"}>
                    {CHIP_TEXT[action] ?? ""}
                  </text>
                  <text className="node-label" textAnchor="middle" y={below ? 46 : -34}>
                    {labelFor(pid)}
                  </text>
                  <text className="node-sub" textAnchor="middle" y={below ? 61 : -49}>
                    {soc.toFixed(0)}% SOC · floor {floor.toFixed(0)}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
