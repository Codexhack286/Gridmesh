"use client";
import { useCallback, useEffect, useState } from "react";
import { getViolations, clearViolations } from "../lib/api";

export function useViolations() {
  const [total, setTotal] = useState(0);
  const [violations, setViolations] = useState<any[] | null>(null);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await getViolations();
      setTotal(r.total ?? 0);
      setViolations(r.violations ?? []);
    } catch {
      /* backend unreachable — keep last good data */
    }
  }, []);

  const clear = useCallback(async () => {
    setClearing(true);
    try {
      await clearViolations();
      await refresh();
    } finally {
      setClearing(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { total, violations, refresh, clear, clearing };
}
