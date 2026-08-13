"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIncomeStore } from "@/stores/income-store";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

export function useLiveIncome(snapshot?: AquariumSnapshot) {
  const queryClient = useQueryClient();
  const setIncome = useIncomeStore((state) => state.setIncome);
  const tick = useIncomeStore((state) => state.tick);

  useEffect(() => {
    if (!snapshot) return;
    setIncome(snapshot.user.currency, snapshot.incomePerSecond);
  }, [snapshot, setIncome]);

  useEffect(() => {
    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const delta = Math.min(1, (now - last) / 1000);
      last = now;
      tick(delta);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  const hasSnapshot = Boolean(snapshot);
  useEffect(() => {
    if (!hasSnapshot) return;
    let syncing = false;
    const sync = async () => {
      if (syncing || document.visibilityState === "hidden") return;
      syncing = true;
      try {
        const result = await api<{ snapshot: AquariumSnapshot }>("/api/income/claim", { method: "POST" });
        queryClient.setQueryData(["snapshot"], result.snapshot);
      } catch {
        // The optimistic counter keeps running; the next successful sync claims
        // all elapsed server-side time without trusting the client's clock.
      } finally {
        syncing = false;
      }
    };
    const interval = window.setInterval(() => void sync(), 30_000);
    const onVisibility = () => document.visibilityState === "visible" && void sync();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasSnapshot, queryClient]);
}
