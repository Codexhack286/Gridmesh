/**
 * Shared utility functions for GridMesh frontend.
 */

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
