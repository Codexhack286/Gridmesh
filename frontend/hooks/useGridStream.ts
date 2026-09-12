"use client";
import { useCallback, useEffect, useState } from "react";
import { postTick, getReports, getBlockchainStatus, postRogueBid } from "../lib/api";

export function useGridStream() {
  const [data, setData] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [chainStatus, setChainStatus] = useState<any>(null);
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [injecting, setInjecting] = useState(false);

  const refreshMeta = useCallback(async () => {
    try {
      setReports(await getReports());
    } catch {
      /* backend unreachable — panels stay empty rather than crashing */
    }
    try {
      setChainStatus(await getBlockchainStatus());
    } catch {
      /* pre-Phase-4 backend without the status route */
    }
  }, []);

  const advance = useCallback(async () => {
    setLoading(true);
    try {
      setData(await postTick());
      await refreshMeta();
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

  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  return { data, reports, chainStatus, lastInjection, checkedAt, loading, injecting, advance, inject, check };
}
