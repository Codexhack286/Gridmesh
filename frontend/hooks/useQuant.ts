"use client";

import { useCallback, useEffect, useState } from "react";
import { getQuantStatus } from "../lib/api";

export function useQuant() {
  const [status, setStatus] = useState<any>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getQuantStatus();
      setStatus(data);
    } catch {
      /* backend unreachable or pre-quant route */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, refresh };
}
