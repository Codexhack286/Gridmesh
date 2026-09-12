export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function postTick() {
  const r = await fetch(`${API_BASE}/tick`, { method: "POST" });
  return r.json();
}
