"use client";

import { useState } from "react";
import { Check, Gift, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { aquariumAssets } from "@/assets/aquarium-assets";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/features/auth/use-player";
import { useDailyReward } from "@/features/rewards/use-daily-reward";

const tabs = ["Награды", "Задания", "Достижения", "Подарки"];

function formatClaimTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function DailyRewardsScreen() {
  const player = usePlayer();
  const daily = useDailyReward();
  const [activeTab, setActiveTab] = useState("Награды");
  const claimedToday = player.data?.dailyReward.claimedToday ?? false;
  const rewardAmount = player.data?.dailyReward.amount ?? 100;
  const nextClaimTime = formatClaimTime(player.data?.dailyReward.nextClaimAt);
  const achievements = player.data?.achievements ?? [];
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlockedAt).length;

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Подарки</h1>
        <p className="mt-2 text-sm text-cyan-100/62">Награды, задания, достижения и подарки от друзей.</p>
      </header>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-cyan-100/12 bg-slate-950/28 p-1">
        {tabs.map((tab) => (
          <button key={tab} className={cn("h-9 rounded-xl text-[11px] font-black text-cyan-100/68 transition", activeTab === tab && "bg-cyan-300/18 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,.16)]")} onClick={() => setActiveTab(tab)} type="button">
            {tab}
          </button>
        ))}
      </div>

      <Panel className="relative space-y-4 overflow-hidden rounded-[18px] border-cyan-100/18 bg-[linear-gradient(145deg,rgba(8,45,62,.82),rgba(5,20,34,.88))]">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-200/16 blur-3xl" />
        <div className="relative z-10">
          <div className="text-lg font-black text-cyan-50">Ежедневный бонус</div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, index) => {
              const active = !claimedToday && index === 4;
              const done = claimedToday ? index <= 4 : index < 4;
              return (
                <div key={index} className={cn("grid min-h-12 place-items-center rounded-xl border text-[10px] font-black", active ? "border-cyan-100/35 bg-cyan-300 text-slate-950" : done ? "border-emerald-200/22 bg-emerald-300/16 text-emerald-100" : "border-cyan-100/10 bg-slate-950/30 text-cyan-100/42")}>
                  <span>Д{index + 1}</span>
                  {done ? <Check className="h-3.5 w-3.5" /> : index === 6 ? <Gift className="h-3.5 w-3.5 text-amber-200" /> : <span className="h-3.5" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 rounded-2xl border border-cyan-100/10 bg-slate-950/28 p-3">
          <img className="h-24 w-24 shrink-0 object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,.32)]" src={claimedToday ? aquariumAssets.rewards.dailyGiftOpen : aquariumAssets.rewards.dailyGiftClosed} alt="" />
          <div className="min-w-0">
            <div className="text-2xl font-black">+{rewardAmount} водорослей</div>
            <div className="mt-1 text-sm text-cyan-100/60">{claimedToday ? `Бонус уже забран${nextClaimTime ? `. Следующий в ${nextClaimTime}` : ""}` : "Можно забрать один раз в 24 часа."}</div>
          </div>
        </div>
        <Button className={cn("h-12 w-full", claimedToday ? "bg-slate-700 text-cyan-100 shadow-none" : "bg-cyan-300")} disabled={daily.isPending || claimedToday} onClick={() => daily.mutate()}>
          {claimedToday ? "Получено" : "Забрать"}
        </Button>
      </Panel>

      <Panel className="space-y-3 rounded-[18px] border-cyan-100/16 bg-[linear-gradient(145deg,rgba(8,43,59,.76),rgba(4,18,31,.86))]">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black text-cyan-50">Задания</div>
          <div className="text-xs text-cyan-100/58">3 доступно</div>
        </div>
        <Quest title="Покорми рыб 5 раз" reward="+30" progress="3/5" tone="amber" />
        <Quest title="Очисти аквариум" reward="+20" progress="1/1" tone="emerald" done />
        <Quest title="Купи предмет в магазине" reward="+50" progress="0/1" tone="cyan" />
      </Panel>

      <Panel className="space-y-3 overflow-hidden rounded-[18px] border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(168,85,247,.14),rgba(34,211,238,.08),rgba(5,18,31,.72))]">
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
          <div className="rounded-full bg-slate-950/45 px-3 py-1 text-xs font-black text-cyan-100">{unlockedAchievements}/{achievements.length || 10}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {achievements.slice(0, 4).map((achievement, index) => (
            <div key={achievement.id} className="relative min-h-24 overflow-hidden rounded-2xl border border-cyan-100/12 bg-slate-950/30 p-2 text-center">
              <img className="mx-auto h-10 w-10 object-contain" src={achievement.unlockedAt ? [aquariumAssets.achievements.firstFish, aquariumAssets.achievements.caretaker, aquariumAssets.achievements.collector, aquariumAssets.achievements.masterAquarist][index % 4] : aquariumAssets.rewards.lockedMystery} alt="" />
              <div className="mt-2 line-clamp-2 text-[10px] font-black text-cyan-50">{achievement.title}</div>
              <div className="mt-1 text-[10px] font-black text-amber-100">+{achievement.reward}</div>
            </div>
          ))}
        </div>
      </Panel>

      {daily.error ? <p className="rounded-2xl bg-yellow-300/10 p-3 text-sm text-yellow-100">{daily.error.message}</p> : null}
    </div>
  );
}

function Quest({ title, reward, progress, tone, done = false }: { title: string; reward: string; progress: string; tone: "amber" | "emerald" | "cyan"; done?: boolean }) {
  const bar = tone === "amber" ? "bg-amber-300" : tone === "emerald" ? "bg-emerald-300" : "bg-cyan-300";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cyan-100/10 bg-slate-950/28 p-3">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", done ? "bg-emerald-300/18 text-emerald-100" : "bg-cyan-300/14 text-cyan-100")}>
        <Check className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-cyan-50">{title}</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-950/64">
          <div className={cn("h-full rounded-full", bar)} style={{ width: done ? "100%" : "60%" }} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-black text-amber-100">{reward}</div>
        <div className="text-[10px] text-cyan-100/55">{progress}</div>
      </div>
    </div>
  );
}
