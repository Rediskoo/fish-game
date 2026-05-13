"use client";

import { Fish, ShoppingBag, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useMarketplace, usePurchase } from "@/features/marketplace/use-marketplace";

const rarityLabel: Record<string, string> = {
  COMMON: "Common",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary"
};

export function MarketplaceScreen() {
  const player = usePlayer();
  const marketplace = useMarketplace();
  const purchase = usePurchase();

  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Marketplace</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Новые жители</h1>
      </header>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-cyan-100/65">Баланс</div>
            <div className="text-2xl font-black">{player.data?.user.currency ?? 0} водорослей</div>
          </div>
          <Button disabled={purchase.isPending} onClick={() => purchase.mutate({ item: "fish" })}>
            <ShoppingBag className="h-4 w-4" /> Купить рыбку · 100
          </Button>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold">Корм</div>
            <div className="text-sm text-cyan-100/60">1 корм = 1 водоросль</div>
          </div>
          <Button className="bg-emerald-300" disabled={purchase.isPending} onClick={() => purchase.mutate({ item: "food", amount: 10 })}>
            <Utensils className="h-4 w-4" /> +10
          </Button>
        </div>
      </Panel>

      <div className="grid gap-3">
        {marketplace.data?.fishTypes.map((fish) => (
          <div key={fish.id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ backgroundColor: `${fish.glowColor}22` }}>
              <Fish className="h-7 w-7" style={{ color: fish.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{fish.displayName}</div>
              <div className="text-xs text-cyan-100/60">
                {rarityLabel[fish.rarity]} · шанс {(fish.dropChanceBps / 100).toFixed(1)}% · +{fish.incomePerSecond}/сек
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
