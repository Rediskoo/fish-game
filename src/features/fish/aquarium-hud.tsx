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
            <h1 className="text-xl font-black text-cyan-50 text-glow">
              {player.data?.aquarium.name ?? "Telegram Aquarium"}
            </h1>
          </div>
          <div className="rounded-xl bg-cyan-300/15 p-3">
            <Fish className="h-6 w-6 text-cyan-100" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric icon={<Coins className="h-4 w-4" />} label="Водоросль" value={Math.floor(optimisticCurrency).toString()} />
          <Metric icon={<Fish className="h-4 w-4" />} label="Рыбки" value={(player.data?.fish.length ?? 0).toString()} />
          <Metric icon={<Utensils className="h-4 w-4" />} label="Корм" value={(player.data?.inventory.food ?? 0).toString()} />
        </div>
      </header>
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
