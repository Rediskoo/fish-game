"use client";

import { useState } from "react";
import { Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { aquariumAssets } from "@/assets/aquarium-assets";
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
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const claimedToday = player.data?.dailyReward.claimedToday ?? false;
  const rewardAmount = player.data?.dailyReward.amount ?? 100;
  const nextClaimTime = formatClaimTime(player.data?.dailyReward.nextClaimAt);
  const achievements = player.data?.achievements ?? [];
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlockedAt).length;
  const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, 4);

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Ежедневный бонус</h1>
      </header>
      <Panel className="relative space-y-4 overflow-hidden border-amber-200/20 bg-[linear-gradient(145deg,rgba(251,191,36,.16),rgba(34,211,238,.10),rgba(5,18,31,.55))]">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative z-10 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, index) => {
            const active = !claimedToday && index === 4;
            const done = claimedToday ? index <= 4 : index < 4;
            return (
              <div key={index} className={cn("grid min-h-12 place-items-center rounded-xl border text-[10px] font-black", active ? "border-cyan-100/35 bg-cyan-300 text-slate-950" : done ? "border-emerald-200/22 bg-emerald-300/16 text-emerald-100" : "border-cyan-100/10 bg-slate-950/30 text-cyan-100/42")}>
                <span>Д{index + 1}</span>
                {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5" />}
              </div>
            );
          })}
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <img className="h-24 w-24 shrink-0 object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,.32)]" src={claimedToday ? aquariumAssets.rewards.dailyGiftOpen : aquariumAssets.rewards.dailyGiftClosed} alt="" />
          <div className="min-w-0">
            <div className="text-2xl font-black">+{rewardAmount} водорослей</div>
            <div className="mt-1 text-sm text-cyan-100/60">
            {claimedToday && nextClaimTime
              ? `Бонус уже забран. Следующий подарок будет доступен ${nextClaimTime}.`
              : "Можно забрать один раз в 24 часа."}
            </div>
          </div>
        </div>
        <Button className={claimedToday ? "bg-slate-700 text-cyan-100 shadow-none" : undefined} disabled={daily.isPending || claimedToday} onClick={() => daily.mutate()}>
          {claimedToday ? "Уже забрано" : "Забрать"}
        </Button>
        {daily.error ? <p className="text-sm text-yellow-100">{daily.error.message}</p> : null}
      </Panel>

      <Panel className="space-y-3 overflow-hidden border-fuchsia-200/20 bg-[linear-gradient(135deg,rgba(168,85,247,.18),rgba(34,197,94,.12),rgba(34,211,238,.08),rgba(251,191,36,.10))]">
        <div className="flex items-center justify-between gap-2 font-bold">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-300/18 text-amber-100">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <div className="text-cyan-50">Достижения</div>
              <div className="text-xs text-cyan-100/58">открыто {unlockedAchievements}/{achievements.length || 10}</div>
            </div>
          </div>
          <div className="rounded-full bg-slate-950/45 px-3 py-1 text-xs font-black text-amber-100">{unlockedAchievements}/{achievements.length || 10}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {visibleAchievements.map((achievement, index) => (
            <div key={achievement.id} className={cn("relative min-h-28 overflow-hidden rounded-2xl border p-3", achievement.unlockedAt ? "border-amber-200/26 bg-amber-300/14 shadow-[0_0_26px_rgba(251,191,36,.10)]" : "border-cyan-100/10 bg-slate-950/30 opacity-70")}>
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl", achievement.unlockedAt ? (index % 3 === 0 ? "bg-fuchsia-300/20" : index % 3 === 1 ? "bg-emerald-300/18" : "bg-violet-300/18") : "bg-slate-400/10")} />
              <div className="relative z-10 flex items-start justify-between gap-2">
                <img className="h-10 w-10 shrink-0 object-contain" src={achievement.unlockedAt ? aquariumAssets.achievements.firstFish : aquariumAssets.rewards.lockedMystery} alt="" />
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-black text-cyan-50">{achievement.title}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-cyan-100/62">
                    {achievement.unlockedAt ? `Открыто ${formatAchievementTime(achievement.unlockedAt)}` : achievement.description}
                  </div>
                </div>
                <div className="rounded-full bg-slate-950/42 px-2 py-1 text-[11px] font-black text-amber-100">+{achievement.reward}</div>
              </div>
            </div>
          ))}
        </div>
        {achievements.length > 4 ? (
          <Button className="w-full bg-violet-300" onClick={() => setShowAllAchievements((value) => !value)}>
            {showAllAchievements ? "Скрыть" : "Все достижения"}
          </Button>
        ) : null}
      </Panel>
    </div>
  );
}
