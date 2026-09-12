/**
 * Shared utility functions and Indian Microgrid energy benchmarks for GridMesh frontend.
 */

// Indian Central Electricity Authority (CEA) & DISCOM Energy Benchmarks
export const INDIA_GRID_TARIFF_INR = 8.00; // DISCOM retail tariff (₹/kWh average commercial/domestic)
export const INDIA_SOLAR_FEEDIN_INR = 2.60; // DISCOM net-metering solar export buyback tariff (₹/kWh)
export const INDIA_P2P_CLEARING_INR = 5.50; // Peer-to-peer microgrid clearing rate (₹/kWh)
export const INDIA_CEA_CO2_FACTOR_KG = 0.716; // Central Electricity Authority (CEA) Baseline Database CO2 intensity (kg CO2/kWh)

/**
 * Detailed timestamp metadata for a microgrid simulation tick.
 * Each tick represents one 15-minute electrical operational dispatch interval (96 intervals = 1 full 24-hour day).
 */
export interface SimTimeDetails {
  day: number;           // 1-indexed simulation day (Day 1, Day 2, etc.)
  interval: number;      // 1-96 interval of the day
  hours24: number;       // 0-23
  minutes: number;       // 0, 15, 30, 45
  time12: string;        // "07:15 AM", "12:00 PM", "07:00 PM"
  time24: string;        // "07:15", "12:00", "19:00"
  fullLabel: string;     // "Day 1 · 07:15 AM IST"
  clockLabel: string;    // "Day 1 · 07:15 AM IST"
  chartLabel: string;    // "07:15 AM"
}

export function parseSimTime(tick: number): SimTimeDetails {
  const safeTick = Math.max(0, Math.floor(Number(tick) || 0));
  const day = Math.floor(safeTick / 96) + 1;
  const interval = (safeTick % 96) + 1;
  const minsInDay = (safeTick % 96) * 15;
  const hours24 = Math.floor(minsInDay / 60);
  const minutes = minsInDay % 60;
  
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const mm = String(minutes).padStart(2, "0");
  const hh24 = String(hours24).padStart(2, "0");
  const hh12 = String(hours12).padStart(2, "0");

  const time12 = `${hh12}:${mm} ${period}`;
  const time24 = `${hh24}:${mm}`;

  return {
    day,
    interval,
    hours24,
    minutes,
    time12,
    time24,
    fullLabel: `Day ${day} · ${time12} IST`,
    clockLabel: `Day ${day} · ${time12} IST`,
    chartLabel: time12,
  };
}

/**
 * Converts a 15-minute simulation tick index into a readable Indian Standard Time string.
 * @param tick - 15-minute tick counter (0, 1, 2, ... 96, ...)
 * @param includeDay - if true returns "Day 1 · 07:15 AM IST", if false returns "07:15 AM IST"
 */
export function tickClock(tick: number, includeDay: boolean = true): string {
  const t = parseSimTime(tick);
  return includeDay ? t.fullLabel : `${t.time12} IST`;
}

/**
 * Formats an ISO / UTC timestamp string into localized Indian Standard Time (IST).
 * e.g. "2026-09-12T11:29:53Z" -> "12 Sep 2026, 04:59 PM IST"
 */
export function formatIST(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "Active Session";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return (
      d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return String(dateInput);
  }
}

/**
 * Truncates a hex hash to a standard display length with ellipsis.
 */
export function truncateHash(h: string, len: number = 10): string {
  if (!h) return "—";
  return h.length > len ? `${h.slice(0, len)}…` : h;
}

/**
 * Formats a monetary amount in Indian Rupees (₹).
 */
export function formatINR(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
