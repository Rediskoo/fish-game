"use client";

import { Coins, Fish, Utensils } from "lucide-react";
import { usePlayer } from "@/features/auth/use-player";
import { useLiveIncome } from "@/features/income/use-live-income";
import { useIncomeStore } from "@/stores/income-store";

export function AquariumHud() {
  const player = usePlayer();
  useLiveIncome(player.data);
  const optimisticCurrency = useIncomeStore((state) => state.optimisticCurrency);

  return (
    <div className="pointer-events-none relative z-10 flex flex-1 flex-col justify-between p-4">
      <header className="glass pointer-events-auto rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Aquarium Idle</p>
            <h1 className="text-xl font-black text-cyan-50 text-glow">
              {player.data?.aquarium.name ?? "Telegram Aquarium"}
            </h1>
          </div>
          <div className="rounded-xl bg-cyan-300/15 p-3">
            <Fish className="h-6 w-6 text-cyan-100" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric icon={<Coins className="h-4 w-4" />} label="водоросль" value={Math.floor(optimisticCurrency).toString()} />
          <Metric icon={<Fish className="h-4 w-4" />} label="рыбки" value={(player.data?.fish.length ?? 0).toString()} />
          <Metric icon={<Utensils className="h-4 w-4" />} label="корм" value={(player.data?.inventory.food ?? 0).toString()} />
        </div>
      </header>

      <div className="glass pointer-events-auto mb-2 rounded-2xl p-3 text-sm text-cyan-50/80">
        <span className="font-semibold text-cyan-100">+{(player.data?.incomePerSecond ?? 0).toFixed(1)}/сек</span>
        <span className="ml-2 text-cyan-100/55">offline income начисляется при возвращении</span>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/30 p-3">
      <div className="flex items-center gap-1 text-cyan-100/70">{icon}<span className="truncate text-[10px]">{label}</span></div>
      <div className="mt-1 truncate text-lg font-black text-cyan-50">{value}</div>
    </div>
  );
}
