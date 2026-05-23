"use client";

import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/features/auth/use-player";
import { useDailyReward } from "@/features/rewards/use-daily-reward";

export function DailyRewardsScreen() {
  const player = usePlayer();
  const daily = useDailyReward();
  const claimedToday = player.data?.dailyReward.claimedToday ?? false;
  const rewardAmount = player.data?.dailyReward.amount ?? 100;

  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Daily Rewards</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Ежедневный бонус</h1>
      </header>
      <Panel className="space-y-4">
        <Gift className={cn("h-10 w-10", claimedToday ? "text-cyan-100/35" : "text-yellow-200")} />
        <div>
          <div className="text-2xl font-black">+{rewardAmount} водорослей</div>
          <div className="text-sm text-cyan-100/60">
            {claimedToday ? "Бонус уже забран сегодня. Новый лимит откроется завтра по UTC." : "Можно забрать один раз в UTC-день."}
          </div>
        </div>
        <Button className={claimedToday ? "bg-slate-700 text-cyan-100 shadow-none" : undefined} disabled={daily.isPending || claimedToday} onClick={() => daily.mutate()}>
          {claimedToday ? "Уже забрано" : "Забрать"}
        </Button>
        {daily.error ? <p className="text-sm text-yellow-100">{daily.error.message}</p> : null}
      </Panel>
    </div>
  );
}
