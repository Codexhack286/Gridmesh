"use client";

import { useEffect, useState } from "react";
import { getQuantStatus } from "../lib/api";

export function useQuant() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    getQuantStatus()
      .then(setStatus)
      .catch(() => {
        /* backend unreachable or pre-quant route */
      });
  }, []);
  return { status };
}
