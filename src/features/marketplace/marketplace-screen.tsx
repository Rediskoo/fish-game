"use client";

import { useMemo, useState } from "react";
import { Fish, PackageOpen, ShoppingBag } from "lucide-react";
import { CasinoRevealModal } from "@/components/fish/casino-reveal-modal";
import { Button } from "@/components/ui/button";
import { useRenameFish, useSellFish } from "@/features/inventory/use-fish-actions";
import { useMarketplace, usePurchase } from "@/features/marketplace/use-marketplace";
import { cn } from "@/lib/cn";
import { AppAssets, shopProducts, type ShopCategory, type ShopProduct } from "@/lib/app-assets";
import type { CaseResult } from "@/types/game";

const filters: Array<{ id: "all" | ShopCategory; label: string }> = [
  { id: "all", label: "Все" },
  { id: "cases", label: "Кейсы" },
  { id: "care", label: "Уход" },
  { id: "decor", label: "Декор" },
  { id: "equipment", label: "Оборудование" },
  { id: "backgrounds", label: "Фоны" }
];

export function MarketplaceScreen() {
  const marketplace = useMarketplace();
  const purchase = usePurchase();
  const sellFish = useSellFish();
  const renameFish = useRenameFish();
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ShopCategory>("all");
  const visibleProducts = useMemo(
    () => shopProducts.filter((product) => activeFilter === "all" || product.category === activeFilter),
    [activeFilter]
  );

  function buy(product: ShopProduct) {
    if (product.id === "fish-case") {
      purchase.mutate(
        { item: "fish" },
        {
          onSuccess: ({ caseResult }) => {
            if (caseResult) setCaseResult(caseResult);
          }
        }
      );
      return;
    }

    if (product.id === "food-basic") {
      purchase.mutate({ item: "food", amount: 10 });
    }
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <div className="relative min-h-36 overflow-hidden rounded-2xl border border-cyan-100/15 bg-slate-950/30 p-4">
          <img className="absolute -right-8 bottom-0 h-36 w-36 object-contain opacity-95" src={AppAssets.shop.building} alt="" />
          <div className="relative z-10 max-w-[68%]">
            <h1 className="text-3xl font-black text-cyan-50 text-glow">Магазин</h1>
            <p className="mt-2 text-sm text-cyan-100/65">Кейсы, корм, декор и фоны для аквариума.</p>
          </div>
        </div>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={cn(
              "h-9 shrink-0 rounded-full border border-cyan-100/12 bg-slate-950/30 px-3 text-sm font-bold text-cyan-100/65",
              activeFilter === filter.id && "border-cyan-100/35 bg-cyan-300/18 text-cyan-50"
            )}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleProducts.map((product) => {
          const canBuy = product.id === "fish-case" || product.id === "food-basic";
          return (
            <button
              key={product.id}
              className="glass grid aspect-square grid-rows-[1fr_auto] overflow-hidden rounded-2xl p-3 text-left transition active:scale-[.98] disabled:opacity-70"
              disabled={purchase.isPending || !canBuy}
              onClick={() => buy(product)}
            >
              <div className="relative min-h-0">
                <span className="absolute left-0 top-0 z-10 rounded-full bg-slate-950/55 px-2 py-1 text-[11px] font-bold text-cyan-100/80">
                  {product.status ?? (canBuy ? "В наличии" : "Скоро")}
                </span>
                <img className="h-full w-full object-contain pt-4 drop-shadow-[0_18px_24px_rgba(0,0,0,.35)]" src={product.image} alt="" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-cyan-50">{product.title}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/12 px-2 py-1 text-xs font-black text-amber-100">
                    {product.price}
                  </span>
                  {product.id === "fish-case" ? <PackageOpen className="h-4 w-4 text-cyan-100/70" /> : <ShoppingBag className="h-4 w-4 text-cyan-100/55" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-sm font-bold text-cyan-100/75">
          <Fish className="h-4 w-4" /> Шансы рыбного кейса
        </div>
        <div className="grid gap-2">
          {marketplace.data?.fishTypes.map((fish) => (
            <div key={fish.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ backgroundColor: `${fish.glowColor}22` }}>
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
      </section>

      {caseResult ? (
        <CasinoRevealModal
          result={caseResult}
          isBusy={sellFish.isPending || renameFish.isPending}
          error={sellFish.error?.message ?? renameFish.error?.message}
          onClose={() => setCaseResult(null)}
          onRename={(name) => caseResult.reward.kind === "fish" && renameFish.mutate({ fishId: caseResult.reward.fish.id, name })}
          onSell={() =>
            caseResult.reward.kind === "fish" && sellFish.mutate(caseResult.reward.fish.id, {
              onSuccess: () => setCaseResult(null)
            })
          }
        />
      ) : null}
    </div>
  );
}

