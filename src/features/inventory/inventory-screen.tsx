"use client";

import { FormEvent, useMemo, useState } from "react";
import { Fish, Heart, Image as ImageIcon, Info, Package, Pencil, Sparkles, Trash2, Utensils, Waves, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useRenameFish, useSellFish, useToggleFavoriteFish } from "@/features/inventory/use-fish-actions";
import { useFeedFish } from "@/features/inventory/use-feed-fish";
import { api } from "@/lib/api/client";
import { AppAssets, decorProducts, shopProducts, type ShopProduct } from "@/lib/app-assets";
import { cn } from "@/lib/cn";
import type { AquariumSnapshot, FishView } from "@/types/game";

type InventoryTab = "food" | "decor" | "backgrounds" | "fish";

const inventoryTabs: Array<{ id: InventoryTab; label: string; icon: typeof Package }> = [
  { id: "food", label: "Корм", icon: Utensils },
  { id: "decor", label: "Декор", icon: Sparkles },
  { id: "backgrounds", label: "Фоны", icon: ImageIcon },
  { id: "fish", label: "Рыбки", icon: Fish }
];

function formatAge(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} д. ${hours} ч.`;
  if (hours > 0) return `${hours} ч. ${minutes} мин.`;
  return `${Math.max(1, minutes)} мин.`;
}

function fullness(fish: FishView) {
  return Math.max(0, fish.maxHunger - fish.hunger);
}

export function InventoryScreen() {
  const queryClient = useQueryClient();
  const player = usePlayer();
  const feed = useFeedFish();
  const renameFish = useRenameFish();
  const sellFish = useSellFish();
  const favorite = useToggleFavoriteFish();
  const customize = useMutation({
    mutationFn: (input: { decorId?: string; enabled?: boolean; backgroundId?: string; clean?: boolean }) =>
      api<AquariumSnapshot>("/api/aquarium", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
  const food = player.data?.inventory.food ?? 0;
  const cleaner = player.data?.inventory.cleaner ?? 0;
  const activeDecor = player.data?.aquarium.decor ?? [];
  const activeBackground = player.data?.aquarium.backgroundId ?? "deep-lagoon";
  const backgroundProducts = useMemo(() => shopProducts.filter((product) => product.category === "backgrounds"), []);
  const [activeTab, setActiveTab] = useState<InventoryTab>("food");
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const fishList = useMemo(() => [...(player.data?.fish ?? [])].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)), [player.data?.fish]);
  const selectedFish = useMemo(() => fishList.find((fish) => fish.id === selectedFishId) ?? null, [fishList, selectedFishId]);
  const capacity = 20;

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Корм и склад</h1>
        <p className="mt-2 text-sm text-cyan-100/62">Управление запасами, фонами, декором и рыбками.</p>
      </header>

      <div className="grid grid-cols-4 gap-2">
        {inventoryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={cn("grid h-16 place-items-center rounded-2xl border border-cyan-100/10 bg-slate-950/28 text-xs font-black text-cyan-100/58 transition", active && "border-cyan-200/35 bg-cyan-300/16 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,.14)]")}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "food" ? <FoodSection food={food} cleaner={cleaner} pollution={player.data?.aquarium.pollution ?? 0} isBusy={customize.isPending} onClean={() => customize.mutate({ clean: true })} /> : null}
      {activeTab === "decor" ? <DecorSection activeDecor={activeDecor} isBusy={customize.isPending} onToggle={(product, enabled) => customize.mutate({ decorId: product.id, enabled })} /> : null}
      {activeTab === "backgrounds" ? <BackgroundSection products={backgroundProducts} activeBackground={activeBackground} isBusy={customize.isPending} onSelect={(product) => customize.mutate({ backgroundId: product.id })} /> : null}
      {activeTab === "fish" ? (
        <FishSection
          fishList={fishList}
          capacity={capacity}
          onFavorite={(fish) => favorite.mutate({ fishId: fish.id, isFavorite: !fish.isFavorite })}
          onSelect={(fish) => setSelectedFishId(fish.id)}
        />
      ) : null}

      {customize.error ? <p className="rounded-2xl bg-yellow-300/10 p-3 text-sm text-yellow-100">{customize.error.message}</p> : null}

      {selectedFish ? (
        <FishModal
          fish={selectedFish}
          food={food}
          isBusy={feed.isPending || renameFish.isPending || sellFish.isPending || favorite.isPending}
          error={feed.error?.message ?? renameFish.error?.message ?? sellFish.error?.message ?? favorite.error?.message}
          onClose={() => setSelectedFishId(null)}
          onFeed={() => feed.mutate(selectedFish.id)}
          onRename={(name) => renameFish.mutate({ fishId: selectedFish.id, name })}
          onFavorite={() => favorite.mutate({ fishId: selectedFish.id, isFavorite: !selectedFish.isFavorite })}
          onSell={() =>
            sellFish.mutate(selectedFish.id, {
              onSuccess: () => setSelectedFishId(null)
            })
          }
        />
      ) : null}
    </div>
  );
}

function FoodSection({ food, cleaner, pollution, isBusy, onClean }: { food: number; cleaner: number; pollution: number; isBusy: boolean; onClean: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="relative grid aspect-square overflow-hidden rounded-[22px] border border-cyan-100/12 bg-slate-950/32 p-3 text-left shadow-[0_18px_54px_rgba(0,0,0,.22)]">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/50 px-2 py-1 text-[10px] font-black text-cyan-100/76">?????</span>
        <img className="relative z-10 mx-auto mt-6 h-20 w-20 object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,.38)]" src={AppAssets.care.foodBasic} alt="" />
        <div className="relative z-10 mt-auto min-w-0">
          <div className="text-3xl font-black text-cyan-50">{food}</div>
          <div className="mt-1 text-xs text-cyan-100/62">????? ? ?????????</div>
        </div>
      </div>
      <button className="relative grid aspect-square overflow-hidden rounded-[22px] border border-cyan-100/12 bg-slate-950/32 p-3 text-left shadow-[0_18px_54px_rgba(0,0,0,.22)] disabled:opacity-60" disabled={isBusy || cleaner <= 0 || pollution <= 0} onClick={onClean}>
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/50 px-2 py-1 text-[10px] font-black text-cyan-100/76">???????</span>
        <img className="relative z-10 mx-auto mt-6 h-20 w-20 object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,.38)]" src={AppAssets.care.waterConditioner} alt="" />
        <div className="relative z-10 mt-auto min-w-0">
          <div className="text-3xl font-black text-cyan-50">{cleaner}</div>
          <div className="mt-1 text-xs text-cyan-100/62">?????: {pollution}</div>
        </div>
      </button>
    </div>
  );
}

function DecorSection({ activeDecor, isBusy, onToggle }: { activeDecor: string[]; isBusy: boolean; onToggle: (product: ShopProduct, enabled: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {decorProducts.map((product) => {
        const active = activeDecor.includes(product.id);
        return (
          <button key={product.id} className={cn("relative grid aspect-square overflow-hidden rounded-[22px] border p-3 text-left transition active:scale-[.98]", active ? "border-emerald-200/35 bg-emerald-300/12" : "border-cyan-100/12 bg-slate-950/32")} disabled={isBusy} onClick={() => onToggle(product, !active)}>
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: product.accent + "24" }} />
            <span className={cn("absolute left-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-black", active ? "bg-emerald-300/18 text-emerald-100" : "bg-slate-950/50 text-cyan-100/70")}>{active ? "В аквариуме" : "На складе"}</span>
            <img className="relative z-10 mx-auto mt-6 h-20 w-20 object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,.38)]" src={product.image} alt="" />
            <div className="relative z-10 mt-auto min-w-0">
              <div className="truncate text-sm font-black text-cyan-50">{product.title}</div>
              <div className="mt-1 text-xs text-cyan-100/60">{active ? "Нажми, чтобы убрать" : "Нажми, чтобы добавить"}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BackgroundSection({ products, activeBackground, isBusy, onSelect }: { products: ShopProduct[]; activeBackground: string; isBusy: boolean; onSelect: (product: ShopProduct) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => {
        const active = activeBackground === product.id;
        return (
          <button key={product.id} className={cn("relative grid aspect-square overflow-hidden rounded-[22px] border p-3 text-left shadow-[0_18px_54px_rgba(0,0,0,.22)] transition active:scale-[.98]", active ? "border-cyan-200/40" : "border-cyan-100/12")} disabled={isBusy || active} onClick={() => onSelect(product)}>
            <img className="absolute inset-0 h-full w-full object-cover opacity-80" src={product.image} alt="" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,12,22,.08),rgba(2,12,22,.84))]" />
            <span className={cn("absolute left-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-black", active ? "bg-cyan-300/20 text-cyan-50" : "bg-slate-950/50 text-cyan-100/76")}>{active ? "Текущий" : "Фон"}</span>
            <div className="relative z-10 mt-auto min-w-0">
              <div className="truncate text-sm font-black text-cyan-50 text-glow">{product.title}</div>
              <div className="mt-1 text-xs text-cyan-100/66">{active ? "Уже стоит" : "Поставить"}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FishSection({ fishList, capacity, onFavorite, onSelect }: { fishList: FishView[]; capacity: number; onFavorite: (fish: FishView) => void; onSelect: (fish: FishView) => void }) {
  return (
    <div className="space-y-3">
      <Panel className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-cyan-100/72">
          <Waves className="h-4 w-4" /> Вместимость
        </div>
        <div className={cn("text-sm font-black", fishList.length > capacity ? "text-rose-200" : "text-cyan-50")}>{fishList.length}/{capacity}</div>
      </Panel>
      <div className="grid grid-cols-2 gap-3">
        {fishList.map((fish, index) => {
          const overCapacity = index >= capacity;
          return (
            <div key={fish.id} className={cn("relative grid aspect-square overflow-hidden rounded-[22px] border p-3 text-left shadow-[0_18px_54px_rgba(0,0,0,.22)]", overCapacity ? "border-rose-300/35 bg-rose-500/10" : "border-cyan-100/12 bg-slate-950/32")}>
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: fish.glowColor + "24" }} />
              <span className={cn("absolute left-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-black", overCapacity ? "bg-rose-300/18 text-rose-100" : "bg-slate-950/50 text-cyan-100/76")}>{overCapacity ? "Перенаселение" : fish.rarityLabel}</span>
              <button className={cn("absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-xl bg-slate-950/42 text-cyan-100", fish.isFavorite && "bg-rose-300 text-slate-950")} onClick={() => onFavorite(fish)} aria-label="Избранное">
                <Heart className={cn("h-4 w-4", fish.isFavorite && "fill-current")} />
              </button>
              <div className="relative z-10 mt-7 grid place-items-center">
                <Fish className="h-16 w-16 drop-shadow-[0_0_14px_currentColor]" style={{ color: fish.color }} />
              </div>
              <div className="relative z-10 mt-auto min-w-0">
                <div className="truncate text-sm font-black text-cyan-50">{fish.name}</div>
                <div className={cn("mt-1 line-clamp-2 min-h-8 text-xs", overCapacity ? "text-rose-100/80" : "text-cyan-100/62")}>{overCapacity ? "Можно заселить после расширения" : "сытость " + fullness(fish) + "/" + fish.maxHunger}</div>
                <Button className="mt-2 h-8 w-full text-xs" onClick={() => onSelect(fish)}>
                  <Info className="h-3.5 w-3.5" /> Инфо
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function FishModal({
  fish,
  food,
  isBusy,
  error,
  onClose,
  onFeed,
  onRename,
  onFavorite,
  onSell
}: {
  fish: FishView;
  food: number;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onFeed: () => void;
  onRename: (name: string) => void;
  onFavorite: () => void;
  onSell: () => void;
}) {
  const [name, setName] = useState(fish.name);
  const [feedingBurst, setFeedingBurst] = useState(0);
  const fishFullness = fullness(fish);
  const fullnessPercent = Math.max(0, Math.min(100, (fishFullness / fish.maxHunger) * 100));
  const birthday = new Date(fish.birthday).toLocaleDateString("ru-RU");

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(name);
  }

  function handleFeed() {
    setFeedingBurst((value) => value + 1);
    window.setTimeout(onFeed, 520);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/70 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)] sm:place-items-center">
      <div className="glass w-full min-w-0 max-w-[calc(100dvw-1.5rem)] space-y-4 overflow-x-hidden rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <form className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={handleRename}>
            <input className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-lg font-black text-cyan-50 outline-none focus:border-cyan-200/45" maxLength={18} minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
            <Button className="h-11 w-11 shrink-0 px-0" disabled={isBusy || name.trim().length < 2 || name.trim() === fish.name} type="submit" aria-label="Переименовать">
              <Pencil className="h-4 w-4" />
            </Button>
          </form>
          <Button className="h-11 w-11 shrink-0 bg-rose-300 px-0" disabled={isBusy} onClick={onSell} aria-label="Продать">
            <Trash2 className="h-4 w-4" />
          </Button>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950/40 text-cyan-100" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-sm font-bold" style={{ color: fish.rarityColor }}>{fish.rarityLabel} · {fish.displayName}</div>

        <div className="relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35" style={{ boxShadow: `0 0 70px ${fish.glowColor}33` }}>
          <AquariumRenderer fish={[fish]} className="h-full min-h-0 rounded-none" backgroundId="deep-lagoon" decor={[]} pollution={0} />
          {feedingBurst > 0 ? (
            <div key={feedingBurst} className="pointer-events-none absolute inset-0 z-20">
              {Array.from({ length: 7 }).map((_, index) => (
                <span
                  key={index}
                  className="absolute h-2.5 w-2.5 animate-[feed-drop_900ms_ease-in_forwards] rounded-full bg-amber-200 shadow-[0_0_10px_rgba(253,230,138,.85)]"
                  style={{ left: String(28 + index * 7) + "%", top: String(8 + (index % 2) * 4) + "%", animationDelay: String(index * 45) + "ms" }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoRow label="Возраст" value={formatAge(fish.ageSeconds)} />
          <InfoRow label="Доход" value={`+${fish.incomePerSecond.toFixed(1)}/сек`} />
          <InfoRow label="Рождение" value={birthday} />
          <InfoRow label="Характер" value={fish.personalityLabel} />
        </div>

        <p className="text-sm text-cyan-50/78">{fish.description}</p>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-cyan-100/70">
            <span>Сытость</span>
            <span>{fishFullness}/{fish.maxHunger}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-950/60">
            <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${fullnessPercent}%` }} />
          </div>
        </div>

        {error ? <p className="text-sm text-yellow-100">{error}</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <Button className="bg-emerald-300" disabled={isBusy || food <= 0 || fish.hunger <= 0} onClick={handleFeed}>
            <Utensils className="h-4 w-4" /> Покормить
          </Button>
          <Button className={cn(fish.isFavorite && "bg-rose-300")} disabled={isBusy} onClick={onFavorite}>
            <Heart className={cn("h-4 w-4", fish.isFavorite && "fill-current")} /> Избранное
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/30 p-3">
      <div className="text-xs text-cyan-100/55">{label}</div>
      <div className="mt-1 truncate font-bold text-cyan-50">{value}</div>
    </div>
  );
}
