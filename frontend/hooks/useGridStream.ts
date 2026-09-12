"use client";
import { useCallback, useEffect, useState } from "react";
import { postTick, getReports, getBlockchainStatus, postRogueBid, clearViolations } from "../lib/api";

export interface TickPoint { tick: number; solarKw: number; loadKw: number; }
const HISTORY_CAP = 20;

function sumForecasts(data: any): TickPoint | null {
  const f = data?.forecasts;
  if (!Array.isArray(f) || f.length === 0) return null;
  const solarKw = f.reduce((a: number, x: any) => a + (Number(x.predicted_gen_kw) || 0), 0);
  const loadKw = f.reduce((a: number, x: any) => a + (Number(x.predicted_load_kw) || 0), 0);
  return { tick: data.tick, solarKw: Math.round(solarKw * 100) / 100, loadKw: Math.round(loadKw * 100) / 100 };
}

export function useGridStream() {
  const [data, setData] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [chainStatus, setChainStatus] = useState<any>(null);
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [tickFailed, setTickFailed] = useState(false);
  const [tickHistory, setTickHistory] = useState<TickPoint[]>([]);

  const refreshMeta = useCallback(async () => {
    try { setReports(await getReports()); } catch { /* backend unreachable */ }
    try { setChainStatus(await getBlockchainStatus()); } catch { /* pre-Phase-4 backend */ }
  }, []);

  const advance = useCallback(async () => {
    setLoading(true);
    try {
      const d = await postTick();
      setData(d);
      setTickFailed(false);
      const pt = sumForecasts(d);
      if (pt) setTickHistory((h) => [...h, pt].slice(-HISTORY_CAP));
      await refreshMeta();
    } catch {
      setTickFailed(true);
    } finally {
      setLoading(false);
    }
  }, [refreshMeta]);

  const inject = useCallback(async (kind: string) => {
    setInjecting(true);
    try {
      setLastInjection(await postRogueBid(kind));
      await refreshMeta();
    } finally {
      setInjecting(false);
    }
  }, [refreshMeta]);

  const check = useCallback(async () => {
    await refreshMeta();
    setCheckedAt(new Date().toISOString());
  }, [refreshMeta]);

  const reset = useCallback(async () => {
    try { await clearViolations(); } catch { /* backend unreachable */ }
    await refreshMeta();
  }, [refreshMeta]);

  useEffect(() => { void refreshMeta(); }, [refreshMeta]);

  return { data, reports, chainStatus, lastInjection, checkedAt, loading, injecting,
           tickFailed, tickHistory, advance, inject, check, reset };
}
