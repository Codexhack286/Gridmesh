"use client";

import { useCallback, useEffect, useState } from "react";
import { getChain, getChainVerify, getBlockchainStatus, postTamper } from "../lib/api";

/* Blockchain panel state: chain listing, verify result, demo-mode flag.
   demoMode comes from GET /api/blockchain/status (backend env guard);
   the tamper UI is rendered ONLY when it is true (conditional return null
   in the panel — absent from the DOM, not merely disabled).
*/
export function useBlockchain() {
  const [chain, setChain] = useState<any[] | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [tamperTick, setTamperTick] = useState<number | null>(null);

  const refreshChain = useCallback(async () => {
    try {
      const c = await getChain();
      setChain(c.blocks ?? []);
      const target = [...(c.blocks ?? [])].reverse().find((b: any) => (b.trade_count ?? 0) > 0);
      setTamperTick((target ?? c.blocks?.[0])?.block_index ?? null);
    } catch {
      /* backend unreachable */
    }
    try {
      const s = await getBlockchainStatus();
      setDemoMode(s.demo_mode === true);
    } catch {
      /* pre-Phase-4 backend */
    }
  }, []);

  const verify = useCallback(async () => {
    setVerifying(true);
    try {
      setVerifyResult(await getChainVerify());
      const c = await getChain();
      setChain(c.blocks ?? []);
    } finally {
      setVerifying(false);
    }
  }, []);

  const tamper = useCallback(async () => {
    if (tamperTick == null) return;
    setTampering(true);
    try {
      await postTamper(tamperTick);
      setVerifyResult(await getChainVerify());
      const c = await getChain();
      setChain(c.blocks ?? []);
    } finally {
      setTampering(false);
    }
  }, [tamperTick]);

  useEffect(() => {
    void refreshChain();
  }, [refreshChain]);

  return { chain, verifyResult, demoMode, verifying, tampering, tamperTick, setTamperTick, verify, tamper, refreshChain };
}
