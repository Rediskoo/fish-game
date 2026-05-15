"use client";

import { Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useFeedFish } from "@/features/inventory/use-feed-fish";

export function InventoryScreen() {
  const player = usePlayer();
  const feed = useFeedFish();

  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Inventory</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Кормление</h1>
      </header>
      <Panel>
        <div className="flex items-center gap-3">
          <Utensils className="h-6 w-6 text-emerald-200" />
          <div>
            <div className="text-2xl font-black">{player.data?.inventory.food ?? 0}</div>
            <div className="text-sm text-cyan-100/60">корма в inventory</div>
          </div>
        </div>
      </Panel>
      <div className="grid gap-3">
        {player.data?.fish.map((fish) => (
          <Panel key={fish.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-bold">{fish.name}</div>
              <div className="text-sm text-cyan-100/60">Голод {fish.hunger}% · доход +{fish.incomePerSecond.toFixed(1)}/сек</div>
            </div>
            <Button disabled={feed.isPending || (player.data?.inventory.food ?? 0) <= 0} onClick={() => feed.mutate(fish.id)}>
              <Utensils className="h-4 w-4" /> Корм
            </Button>
          </Panel>
        ))}
      </div>
      <div className="glass pointer-events-auto mb-2 rounded-2xl p-3 text-sm text-cyan-50/80">
        <span className="font-semibold text-cyan-100">+{(player.data?.incomePerSecond ?? 0).toFixed(1)}/сек</span>
        <span className="ml-2 text-cyan-100/55">offline income начисляется при возвращении</span>
      </div>
    </div>
  );
}
