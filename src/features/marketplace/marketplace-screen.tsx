"use client";

import { useState } from "react";
import { Fish, PackageOpen, Utensils } from "lucide-react";
import { CaseRevealModal } from "@/components/fish/fish-reveal-modal";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useRenameFish, useSellFish } from "@/features/inventory/use-fish-actions";
import { useMarketplace, usePurchase } from "@/features/marketplace/use-marketplace";
import type { CaseResult } from "@/types/game";

export function MarketplaceScreen() {
  const marketplace = useMarketplace();
  const purchase = usePurchase();
  const sellFish = useSellFish();
  const renameFish = useRenameFish();
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);

  return (
    <div className="space-y-4 p-4">
      <header className="pt-14">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Кейсы</h1>
      </header>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-cyan-100/65">Рыбный кейс</div>
            <div className="text-2xl font-black">100 водорослей</div>
          </div>
          <Button
            disabled={purchase.isPending}
            onClick={() =>
              purchase.mutate(
                { item: "fish" },
                {
                  onSuccess: ({ caseResult }) => setCaseResult(caseResult)
                }
              )
            }
          >
            <PackageOpen className="h-4 w-4" /> Открыть
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
                шанс {(fish.dropChanceBps / 100).toFixed(2)}% · +{fish.incomePerSecond}/сек
              </div>
            </div>
          </div>
        ))}
      </div>

      {caseResult ? (
        <CaseRevealModal
          result={caseResult}
          isBusy={sellFish.isPending || renameFish.isPending}
          error={sellFish.error?.message ?? renameFish.error?.message}
          onClose={() => setCaseResult(null)}
          onRename={(name) => renameFish.mutate({ fishId: caseResult.fish.id, name })}
          onSell={() =>
            sellFish.mutate(caseResult.fish.id, {
              onSuccess: () => setCaseResult(null)
            })
          }
        />
      ) : null}
    </div>
  );
}
