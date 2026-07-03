"use client";

import { Gift, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/features/auth/use-player";
import { useDailyReward } from "@/features/rewards/use-daily-reward";

function formatClaimTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatAchievementTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DailyRewardsScreen() {
  const player = usePlayer();
  const daily = useDailyReward();
  const claimedToday = player.data?.dailyReward.claimedToday ?? false;
  const rewardAmount = player.data?.dailyReward.amount ?? 100;
  const nextClaimTime = formatClaimTime(player.data?.dailyReward.nextClaimAt);

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Ежедневный бонус</h1>
      </header>
      <Panel className="space-y-4">
        <Gift className={cn("h-10 w-10", claimedToday ? "text-cyan-100/35" : "text-yellow-200")} />
        <div>
          <div className="text-2xl font-black">+{rewardAmount} водорослей</div>
          <div className="text-sm text-cyan-100/60">
            {claimedToday && nextClaimTime
              ? `Бонус уже забран. Следующий подарок будет доступен ${nextClaimTime}.`
              : "Можно забрать один раз в 24 часа."}
          </div>
        </div>
        <Button className={claimedToday ? "bg-slate-700 text-cyan-100 shadow-none" : undefined} disabled={daily.isPending || claimedToday} onClick={() => daily.mutate()}>
          {claimedToday ? "Уже забрано" : "Забрать"}
        </Button>
        {daily.error ? <p className="text-sm text-yellow-100">{daily.error.message}</p> : null}
      </Panel>

      <Panel className="space-y-3">
        <div className="flex items-center gap-2 font-bold">
          <Trophy className="h-5 w-5 text-amber-200" />
          Достижения
        </div>
        <div className="grid gap-2">
          {player.data?.achievements.map((achievement) => (
            <div key={achievement.id} className={cn("rounded-xl p-3", achievement.unlockedAt ? "bg-amber-300/15" : "bg-slate-950/30 opacity-65")}>
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-bold">{achievement.title}</div>
                <div className="text-xs text-cyan-100/55">+{achievement.reward}</div>
              </div>
              <div className="mt-1 text-xs text-cyan-100/60">
                {achievement.unlockedAt ? `Открыто ${formatAchievementTime(achievement.unlockedAt)}` : achievement.description}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
