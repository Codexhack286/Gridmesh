export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function postTick() {
  const r = await fetch(`${API_BASE}/tick`, { method: "POST" });
  return r.json();
}

export async function getReports() {
  const r = await fetch(`${API_BASE}/api/reports`);
  return r.json();
}

export async function getBlockchainStatus() {
  const r = await fetch(`${API_BASE}/api/blockchain/status`);
  return r.json();
}

export async function postRogueBid(kind: string, tick = 9999) {
  const r = await fetch(`${API_BASE}/api/scenario/rogue_bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, tick }),
  });
  return r.json();
}

export async function getChain() {
  const r = await fetch(`${API_BASE}/api/blockchain/chain`);
  return r.json();
}

export async function getChainVerify() {
  const r = await fetch(`${API_BASE}/api/blockchain/verify`);
  return r.json();
}

export async function postTamper(tick: number) {
  const r = await fetch(`${API_BASE}/api/blockchain/demo/tamper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tick }),
  });
  return r.json();
}

export async function getQuantStatus() {
  const r = await fetch(`${API_BASE}/api/quant/status`);
  return r.json();
}

export async function getViolations() {
  const r = await fetch(`${API_BASE}/api/scenario/violations`);
  return r.json();
}

export async function clearViolations() {
  const r = await fetch(`${API_BASE}/api/scenario/violations`, { method: "DELETE" });
  return r.json();
}

export async function resetTick() {
  const r = await fetch(`${API_BASE}/tick/reset`, { method: "POST" });
  return r.json();
}


export async function getTrades() {
  const r = await fetch(`${API_BASE}/trades`);
  return r.json();
}
