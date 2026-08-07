"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, PackageOpen, ShoppingBag, Sparkles } from "lucide-react";
import { CasinoRevealModal } from "@/components/fish/casino-reveal-modal";
import { Button } from "@/components/ui/button";
import { useRenameFish, useSellFish } from "@/features/inventory/use-fish-actions";
import { useMarketplace, usePurchase } from "@/features/marketplace/use-marketplace";
import { AppAssets, fishSpeciesAsset, shopCategories, shopProducts, type ShopCategory, type ShopProduct } from "@/lib/app-assets";
import type { CaseResult, MarketplaceFish } from "@/types/game";

export function MarketplaceScreen() {
  const marketplace = useMarketplace();
  const purchase = usePurchase();
  const sellFish = useSellFish();
  const renameFish = useRenameFish();
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShopCategory | null>(null);
  const activeCategoryData = shopCategories.find((category) => category.id === activeCategory);
  const visibleProducts = useMemo(
    () => shopProducts.filter((product) => product.category === activeCategory),
    [activeCategory]
  );
  const productCounts = useMemo(() => {
    return shopCategories.reduce<Record<ShopCategory, number>>((acc, category) => {
      acc[category.id] = shopProducts.filter((product) => product.category === category.id).length;
      return acc;
    }, {} as Record<ShopCategory, number>);
  }, []);

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
        <div className="relative min-h-36 overflow-hidden p-1">
          <div className="absolute right-[-6px] top-0 h-36 w-36 rounded-full bg-cyan-300/10 blur-2xl" />
          <img className="absolute -right-3 top-0 h-36 w-36 object-contain opacity-95 drop-shadow-[0_22px_28px_rgba(0,0,0,.45)]" src={AppAssets.shop.building} alt="" />
          <div className="relative z-10 max-w-[62%] pt-4">
            <h1 className="text-4xl font-black leading-none text-cyan-50 text-glow">Магазин</h1>
            <p className="mt-3 text-sm leading-5 text-cyan-100/74">Всё для аквариума: рыбки, уход, декорации и фоны.</p>
          </div>
        </div>
      </header>

      {!activeCategory ? (
        <div className="space-y-3">
          {shopCategories.map((category) => (
            <button
              key={category.id}
              className="group relative grid min-h-24 grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[18px] border border-cyan-100/20 bg-[linear-gradient(150deg,rgba(14,57,78,.82),rgba(6,25,42,.80))] p-3 text-left shadow-[0_16px_45px_rgba(0,0,0,.28),inset_0_0_0_1px_rgba(103,232,249,.08)] transition active:scale-[.98]"
              onClick={() => setActiveCategory(category.id)}
            >
              <div className="absolute inset-0 opacity-90" style={{ background: `radial-gradient(circle at 20% 50%, ${category.accent}26, transparent 38%), radial-gradient(circle at 88% 50%, ${category.accent}18, transparent 40%)` }} />
              <div className="relative z-10 grid h-[72px] w-[72px] place-items-center rounded-2xl bg-slate-950/34">
                <img className="h-16 w-16 object-contain drop-shadow-[0_14px_20px_rgba(0,0,0,.44)] transition duration-200 group-active:scale-95" src={category.image} alt="" />
              </div>
              <div className="relative z-10 min-w-0">
                <div className="truncate text-lg font-black text-cyan-50 text-glow">{category.title}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-4 text-cyan-100/66">{category.subtitle}</div>
              </div>
              <div className="relative z-10 flex min-w-[74px] flex-col items-end gap-2">
                <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] font-black text-amber-100">
                  {category.id === "fish" ? "от 100" : category.id === "care" ? "от 10" : category.id === "decor" ? "от 35" : "от 150"}
                </span>
                <span className="rounded-full bg-slate-950/45 px-2.5 py-1 text-[10px] font-bold text-cyan-100/72">
                  {productCounts[category.id]} товаров
                </span>
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
              <div className="text-2xl font-black text-cyan-50">{activeCategoryData?.title}</div>
              <div className="text-sm text-cyan-100/60">Выбери предмет внутри раздела</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {visibleProducts.map((product) => (
              <ShopProductCard key={product.id} product={product} isBusy={purchase.isPending} onBuy={() => buy(product)} />
            ))}
          </div>

          {activeCategory === "fish" ? <FishDropPreview fishTypes={marketplace.data?.fishTypes ?? []} /> : null}
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

function ShopProductCard({ product, isBusy, onBuy }: { product: ShopProduct; isBusy: boolean; onBuy: () => void }) {
  const isBackground = product.category === "backgrounds";
  const isCase = product.id === "fish-case";

  return (
    <button
      className={[
        "group relative grid overflow-hidden rounded-[24px] border border-cyan-100/14 bg-[linear-gradient(150deg,rgba(13,38,51,.92),rgba(5,17,29,.90))] p-3 text-left shadow-[0_18px_54px_rgba(0,0,0,.32)] transition active:scale-[.98] disabled:opacity-65",
        isCase ? "col-span-2 min-h-44 grid-cols-[1fr_42%]" : "aspect-square grid-rows-[1fr_auto]"
      ].join(" ")}
      disabled={isBusy}
      onClick={onBuy}
    >
      {isBackground ? <img className="absolute inset-0 h-full w-full object-cover opacity-80" src={product.image} alt="" /> : null}
      <div className="absolute inset-0" style={{ background: isBackground ? "linear-gradient(180deg, rgba(2,12,22,.10), rgba(2,12,22,.82))" : `radial-gradient(circle at 72% 28%, ${product.accent}36, transparent 45%), linear-gradient(180deg, transparent, rgba(0,0,0,.20))` }} />
      {!isBackground ? <div className="absolute -right-8 top-8 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: `${product.accent}24` }} /> : null}
      <span className="absolute left-3 top-3 z-10 rounded-full bg-slate-950/50 px-2 py-1 text-[11px] font-black text-cyan-50/86 backdrop-blur">{product.status ?? "В наличии"}</span>

      {isCase ? (
        <>
          <div className="relative z-10 flex min-w-0 flex-col justify-end pr-2">
            <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-1 text-[11px] font-black text-cyan-100">
              <Sparkles className="h-3 w-3" /> 777 казино
            </div>
            <div className="text-2xl font-black text-cyan-50 text-glow">{product.title}</div>
            <div className="mt-1 text-xs leading-4 text-cyan-100/70">Открой слот и поймай редкую рыбку для аквариума.</div>
            <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-amber-300/15 px-3 py-1.5 text-sm font-black text-amber-100">{product.price}</div>
          </div>
          <div className="relative z-10 grid place-items-center">
            <div className="absolute h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
            <img className="relative h-32 w-32 object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,.48)] transition duration-200 group-active:scale-95" src={product.image} alt="" />
          </div>
        </>
      ) : (
        <>
          <div className="relative min-h-0">
            {!isBackground ? (
              <img className="h-full w-full object-contain pt-5 drop-shadow-[0_20px_26px_rgba(0,0,0,.44)] transition duration-200 group-active:scale-95" src={product.image} alt="" />
            ) : null}
          </div>
          <div className="relative z-10 min-w-0">
            <div className="truncate text-sm font-black text-cyan-50 text-glow">{product.title}</div>
            <div className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-cyan-100/68">{product.description}</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2 py-1 text-xs font-black text-amber-100">{product.price}</span>
              {isCase ? <PackageOpen className="h-4 w-4 text-cyan-100/80" /> : <ShoppingBag className="h-4 w-4 text-cyan-100/62" />}
            </div>
          </div>
        </>
      )}
    </button>
  );
}

function FishDropPreview({ fishTypes }: { fishTypes: MarketplaceFish[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-sm font-bold text-cyan-100/75">
        <Sparkles className="h-4 w-4" /> Возможные рыбки
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fishTypes.map((fish) => (
          <div key={fish.id} className="relative min-h-32 overflow-hidden rounded-[22px] border border-cyan-100/12 bg-slate-950/34 p-3" style={{ boxShadow: `inset 0 0 0 1px ${fish.glowColor}18, 0 16px 38px rgba(0,0,0,.22)` }}>
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: `${fish.glowColor}30` }} />
            <div className="relative z-10 flex items-start justify-between gap-2">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${fish.glowColor}24`, boxShadow: `0 0 28px ${fish.glowColor}34` }}>
                <img className="h-11 w-11 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,.32)]" src={fishSpeciesAsset[fish.species]} alt="" />
              </div>
              <span className="rounded-full bg-slate-950/50 px-2 py-1 text-[10px] font-black text-cyan-50/82">{(fish.dropChanceBps / 100).toFixed(2)}%</span>
            </div>
            <div className="relative z-10 mt-3 min-w-0">
              <div className="truncate text-sm font-black text-cyan-50">{fish.displayName}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: fish.glowColor }}>{fish.rarity}</div>
              <div className="mt-2 text-xs text-cyan-100/62">+{fish.incomePerSecond}/сек</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

