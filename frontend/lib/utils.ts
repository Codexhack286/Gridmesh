/**
 * Shared utility functions and Indian Microgrid energy benchmarks for GridMesh frontend.
 */

// Indian Central Electricity Authority (CEA) & DISCOM Energy Benchmarks
export const INDIA_GRID_TARIFF_INR = 8.00; // DISCOM retail tariff (₹/kWh average commercial/domestic)
export const INDIA_SOLAR_FEEDIN_INR = 2.60; // DISCOM net-metering solar export buyback tariff (₹/kWh)
export const INDIA_P2P_CLEARING_INR = 5.50; // Peer-to-peer microgrid clearing rate (₹/kWh)
export const INDIA_CEA_CO2_FACTOR_KG = 0.716; // Central Electricity Authority (CEA) Baseline Database CO2 intensity (kg CO2/kWh)

/**
 * Converts a 15-minute simulation tick index (0-95 per 24h cycle) into a 24-hour time string "HH:MM".
 */
export function tickClock(tick: number): string {
  const mins = (((tick % 96) + 96) % 96) * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
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
