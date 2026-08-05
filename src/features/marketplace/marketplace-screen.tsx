"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Fish, PackageOpen, ShoppingBag, Sparkles } from "lucide-react";
import { CasinoRevealModal } from "@/components/fish/casino-reveal-modal";
import { Button } from "@/components/ui/button";
import { useRenameFish, useSellFish } from "@/features/inventory/use-fish-actions";
import { useMarketplace, usePurchase } from "@/features/marketplace/use-marketplace";
import { AppAssets, shopCategories, shopProducts, type ShopCategory, type ShopProduct } from "@/lib/app-assets";
import type { CaseResult } from "@/types/game";

export function MarketplaceScreen() {
  const marketplace = useMarketplace();
  const purchase = usePurchase();
  const sellFish = useSellFish();
  const renameFish = useRenameFish();
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShopCategory | null>(null);
  const visibleProducts = useMemo(
    () => shopProducts.filter((product) => product.category === activeCategory),
    [activeCategory]
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

    purchase.mutate({ item: "product", productId: product.id });
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <div className="relative min-h-40 overflow-hidden rounded-[26px] border border-cyan-100/15 bg-[linear-gradient(145deg,rgba(8,31,48,.94),rgba(5,16,27,.86))] p-4 shadow-[0_18px_70px_rgba(0,0,0,.32)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_40%,rgba(73,199,232,.22),transparent_38%),radial-gradient(circle_at_20%_100%,rgba(98,212,172,.12),transparent_36%)]" />
          <img className="absolute -right-6 bottom-0 h-40 w-40 object-contain opacity-95 drop-shadow-[0_22px_28px_rgba(0,0,0,.45)]" src={AppAssets.shop.building} alt="" />
          <div className="relative z-10 max-w-[66%]">
            <h1 className="text-4xl font-black leading-none text-cyan-50 text-glow">Магазин</h1>
            <p className="mt-3 text-sm leading-5 text-cyan-100/68">Всё для аквариума: рыбки, уход, декор и фоны.</p>
          </div>
        </div>
      </header>

      {!activeCategory ? (
        <div className="grid grid-cols-2 gap-3">
          {shopCategories.map((category) => (
            <button
              key={category.id}
              className="group relative grid aspect-square overflow-hidden rounded-[24px] border border-cyan-100/14 bg-[linear-gradient(150deg,rgba(11,45,67,.90),rgba(6,19,31,.88))] p-3 text-left shadow-[0_16px_50px_rgba(0,0,0,.28)] transition active:scale-[.98]"
              onClick={() => setActiveCategory(category.id)}
            >
              <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 72% 30%, ${category.accent}2f, transparent 42%)` }} />
              <span className="absolute left-3 top-3 rounded-full bg-slate-950/50 px-2 py-1 text-[11px] font-bold text-cyan-100/78">Раздел</span>
              <img className="absolute bottom-4 right-[-8px] h-[58%] w-[62%] object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,.40)] transition group-active:scale-95" src={category.image} alt="" />
              <div className="relative z-10 mt-auto min-w-0 pr-14">
                <div className="truncate text-xl font-black text-cyan-50">{category.title}</div>
                <div className="mt-1 text-xs leading-4 text-cyan-100/62">{category.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Button className="h-10 w-10 shrink-0 bg-cyan-100 px-0" onClick={() => setActiveCategory(null)} aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="text-2xl font-black text-cyan-50">{shopCategories.find((category) => category.id === activeCategory)?.title}</div>
              <div className="text-sm text-cyan-100/60">Выбери предмет внутри раздела</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                className="group relative grid aspect-square grid-rows-[1fr_auto] overflow-hidden rounded-[24px] border border-cyan-100/14 bg-[linear-gradient(150deg,rgba(13,38,51,.92),rgba(5,17,29,.90))] p-3 text-left shadow-[0_16px_50px_rgba(0,0,0,.30)] transition active:scale-[.98] disabled:opacity-65"
                disabled={purchase.isPending}
                onClick={() => buy(product)}
              >
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 72% 28%, ${product.accent}2e, transparent 44%)` }} />
                <span className="absolute left-3 top-3 z-10 rounded-full bg-slate-950/58 px-2 py-1 text-[11px] font-black text-cyan-50/82">{product.status ?? "В наличии"}</span>
                <div className="relative min-h-0">
                  <img className="h-full w-full object-contain pt-5 drop-shadow-[0_18px_24px_rgba(0,0,0,.42)] transition group-active:scale-95" src={product.image} alt="" />
                </div>
                <div className="relative z-10 min-w-0">
                  <div className="truncate text-sm font-black text-cyan-50">{product.title}</div>
                  <div className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-cyan-100/58">{product.description}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/13 px-2 py-1 text-xs font-black text-amber-100">{product.price}</span>
                    {product.id === "fish-case" ? <PackageOpen className="h-4 w-4 text-cyan-100/75" /> : <ShoppingBag className="h-4 w-4 text-cyan-100/58" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {activeCategory === "fish" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1 text-sm font-bold text-cyan-100/75">
                <Sparkles className="h-4 w-4" /> Редкость рыбок
              </div>
              <div className="grid gap-2">
                {marketplace.data?.fishTypes.map((fish) => (
                  <div key={fish.id} className="flex items-center gap-3 rounded-2xl border border-cyan-100/12 bg-slate-950/34 p-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ backgroundColor: `${fish.glowColor}24`, boxShadow: `0 0 22px ${fish.glowColor}38` }}>
                      <Fish className="h-7 w-7" style={{ color: fish.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-cyan-50">{fish.displayName}</div>
                      <div className="text-xs text-cyan-100/60">шанс {(fish.dropChanceBps / 100).toFixed(2)}% · +{fish.incomePerSecond}/сек</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

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