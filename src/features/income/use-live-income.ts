"use client";

import { useEffect } from "react";
import { useIncomeStore } from "@/stores/income-store";
import type { AquariumSnapshot } from "@/types/game";

export function useLiveIncome(snapshot?: AquariumSnapshot) {
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
}
