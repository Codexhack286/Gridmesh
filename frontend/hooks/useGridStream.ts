"use client";
import { useCallback, useState } from "react";
import { postTick } from "../lib/api";

export function useGridStream() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const advance = useCallback(async () => {
    setLoading(true);
    try {
      setData(await postTick());
    } finally {
      setLoading(false);
    }
  }, []);
  return { data, loading, advance };
}
