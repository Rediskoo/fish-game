"use client";

import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useDailyReward } from "@/features/rewards/use-daily-reward";

export function DailyRewardsScreen() {
  const daily = useDailyReward();

  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Daily Rewards</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Ежедневный бонус</h1>
      </header>
      <Panel className="space-y-4">
        <Gift className="h-10 w-10 text-yellow-200" />
        <div>
          <div className="text-2xl font-black">+300 водорослей</div>
          <div className="text-sm text-cyan-100/60">Можно забрать один раз в UTC-день.</div>
        </div>
        <Button disabled={daily.isPending} onClick={() => daily.mutate()}>
          Забрать
        </Button>
        {daily.error ? <p className="text-sm text-yellow-100">{daily.error.message}</p> : null}
      </Panel>
    </div>
  );
}
