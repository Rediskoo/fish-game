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

      <Panel className="space-y-3 overflow-hidden border-fuchsia-200/20 bg-[linear-gradient(135deg,rgba(168,85,247,.18),rgba(34,197,94,.12),rgba(34,211,238,.08),rgba(251,191,36,.10))]">
        <div className="flex items-center justify-between gap-2 font-bold">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-300/18 text-amber-100">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <div className="text-cyan-50">Достижения</div>
              <div className="text-xs text-cyan-100/58">прогресс коллекции и аквариума</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {player.data?.achievements.map((achievement, index) => (
            <div key={achievement.id} className={cn("relative min-h-28 overflow-hidden rounded-2xl border p-3", achievement.unlockedAt ? "border-amber-200/26 bg-amber-300/14 shadow-[0_0_26px_rgba(251,191,36,.10)]" : "border-cyan-100/10 bg-slate-950/30 opacity-70")}>
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl", achievement.unlockedAt ? (index % 3 === 0 ? "bg-fuchsia-300/20" : index % 3 === 1 ? "bg-emerald-300/18" : "bg-violet-300/18") : "bg-slate-400/10")} />
              <div className="relative z-10 flex items-start justify-between gap-2">
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
      </Panel>
    </div>
  );
}
