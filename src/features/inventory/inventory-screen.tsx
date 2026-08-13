"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { ArrowLeft, Box, CalendarDays, ChevronRight, Fish, Heart, Image as ImageIcon, Info, Package, Pencil, Sparkles, Trash2, Utensils, Waves, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useRenameFish, useSellFish, useToggleFavoriteFish } from "@/features/inventory/use-fish-actions";
import { useFeedFish } from "@/features/inventory/use-feed-fish";
import { api } from "@/lib/api/client";
import { AppAssets, decorProducts, fishVisualAsset, shopProducts, type ShopProduct } from "@/lib/app-assets";
import { cn } from "@/lib/cn";
import { aquariumFishCapacity } from "@/lib/fish-capacity";
import type { AquariumSnapshot, FishView } from "@/types/game";

type InventoryTab = "food" | "breeding" | "decor" | "backgrounds" | "fish";

const inventoryTabs: Array<{ id: InventoryTab; label: string; icon: typeof Package }> = [
  { id: "food", label: "Корм и уход", icon: Utensils },
  { id: "breeding", label: "Питомник", icon: Sparkles },
  { id: "decor", label: "Декор", icon: Sparkles },
  { id: "backgrounds", label: "Фоны", icon: ImageIcon },
  { id: "fish", label: "Рыбки", icon: Fish }
];

const inventoryTabMeta: Record<InventoryTab, { subtitle: string; accent: string; image: string }> = {
  food: { subtitle: "корм, очистители и уход", accent: "#E5B74F", image: AppAssets.storage.careFood },
  breeding: { subtitle: "инкубаторы, гнёзда и корм для мальков", accent: "#F5B94E", image: AppAssets.care.spawningNest },
  decor: { subtitle: "растения, пузыри и украшения", accent: "#62D4AC", image: AppAssets.storage.decor },
  backgrounds: { subtitle: "фоны и настроение воды", accent: "#9B7BEF", image: AppAssets.storage.backgrounds },
  fish: { subtitle: "все рыбки и перенаселение", accent: "#49C7E8", image: AppAssets.storage.fish }
};

function inventoryBadge(tab: InventoryTab, data: {
  food: number;
  cleaner: number;
  decor: number;
  backgrounds: number;
  fish: number;
  capacity: number;
  breeding: number;
}) {
  if (tab === "food") return `${data.food + data.cleaner} шт.`;
  if (tab === "breeding") return `${data.breeding} шт.`;
  if (tab === "decor") return `${data.decor} активно`;
  if (tab === "backgrounds") return `${data.backgrounds} фонов`;
  return `${data.fish}/${data.capacity}`;
}

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
    mutationFn: (input: { decorId?: string; enabled?: boolean; backgroundId?: string; clean?: boolean; superClean?: boolean }) =>
      api<AquariumSnapshot>("/api/aquarium", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
  const food = player.data?.inventory.food ?? 0;
  const cleaner = player.data?.inventory.cleaner ?? 0;
  const activeDecor = useMemo(() => player.data?.aquarium.decor ?? [], [player.data?.aquarium.decor]);
  const activeBackground = player.data?.aquarium.backgroundId ?? "deep-lagoon";
  const ownedItemIds = useMemo(() => player.data?.inventory.ownedItemIds ?? ["deep-lagoon"], [player.data?.inventory.ownedItemIds]);
  const ownedProducts = useMemo(() => shopProducts.filter((product) => ownedItemIds.includes(product.id)), [ownedItemIds]);
  const ownedDecorProducts = useMemo(
    () => decorProducts.filter((product) => ownedItemIds.includes(product.id) || activeDecor.includes(product.id)),
    [activeDecor, ownedItemIds]
  );
  const backgroundProducts = useMemo(
    () => shopProducts.filter((product) => product.category === "backgrounds" && (ownedItemIds.includes(product.id) || product.id === activeBackground)),
    [activeBackground, ownedItemIds]
  );
  const [activeTab, setActiveTab] = useState<InventoryTab | null>(null);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const fishList = useMemo(() => [...(player.data?.fish ?? [])].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)), [player.data?.fish]);
  const selectedFish = useMemo(() => fishList.find((fish) => fish.id === selectedFishId) ?? null, [fishList, selectedFishId]);
  const capacity = aquariumFishCapacity;

  const counts = {
    food,
    cleaner,
    decor: ownedDecorProducts.length,
    backgrounds: backgroundProducts.length,
    fish: fishList.length,
    capacity
    ,breeding: (player.data?.inventory.spawningNest ?? 0) + (player.data?.inventory.eggIncubator ?? 0) + (player.data?.inventory.fryFood ?? 0) + (player.data?.inventory.nurseryConditioner ?? 0) + (player.data?.inventory.genealogyMedallion ?? 0)
  };
  const totalItems = food + cleaner + ownedProducts.length + fishList.length;
  const activeFishCount = Math.min(fishList.length, capacity);

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Мой склад</h1>
        <p className="mt-2 text-sm text-cyan-100/62">Личный инвентарь, фоны, декор и рыбки.</p>
      </header>

      {!activeTab ? (
        <div className="space-y-4">
          <InventorySummary activeFish={activeFishCount} capacity={capacity} totalItems={totalItems} activeDecor={activeDecor.length} />
          <div className="grid grid-cols-1 gap-3">
            {inventoryTabs.map((tab) => (
              <InventoryCategoryCard
                key={tab.id}
                tab={tab.id}
                title={tab.label}
                subtitle={inventoryTabMeta[tab.id].subtitle}
                image={inventoryTabMeta[tab.id].image}
                accent={inventoryTabMeta[tab.id].accent}
                badge={inventoryBadge(tab.id, counts)}
                icon={tab.icon}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Button className="h-10 w-10 shrink-0 bg-cyan-100 px-0" onClick={() => setActiveTab(null)} aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="text-2xl font-black text-cyan-50">{inventoryTabs.find((tab) => tab.id === activeTab)?.label}</div>
              <div className="text-sm text-cyan-100/60">{inventoryTabMeta[activeTab].subtitle}</div>
            </div>
          </div>

          {activeTab === "food" ? <FoodSection inventory={player.data?.inventory} pollution={player.data?.aquarium.pollution ?? 0} isBusy={customize.isPending} onClean={(superClean) => customize.mutate(superClean ? { superClean: true } : { clean: true })} /> : null}
          {activeTab === "breeding" ? <BreedingItemsSection inventory={player.data?.inventory} /> : null}
          {activeTab === "decor" ? <DecorSection products={ownedDecorProducts} activeDecor={activeDecor} isBusy={customize.isPending} onToggle={(product, enabled) => customize.mutate({ decorId: product.id, enabled })} /> : null}
          {activeTab === "backgrounds" ? <BackgroundSection products={backgroundProducts} activeBackground={activeBackground} isBusy={customize.isPending} onSelect={(product) => customize.mutate({ backgroundId: product.id })} /> : null}
          {activeTab === "fish" ? (
            <FishSection
              fishList={fishList}
              capacity={capacity}
              superFood={player.data?.inventory.superFood ?? 0}
              isFeeding={feed.isPending}
              onFeedAll={() => feed.mutate({ foodType: "aquarium", quantity: 1 })}
              onFavorite={(fish) => favorite.mutate({ fishId: fish.id, isFavorite: !fish.isFavorite })}
              onSelect={(fish) => setSelectedFishId(fish.id)}
            />
          ) : null}
        </section>
      )}

      {customize.error ? <p className="rounded-2xl bg-yellow-300/10 p-3 text-sm text-yellow-100">{customize.error.message}</p> : null}

      {selectedFish ? (
        <FishModal
          fish={selectedFish}
          food={food}
          bigFood={player.data?.inventory.bigFood ?? 0}
          superFood={player.data?.inventory.superFood ?? 0}
          isBusy={feed.isPending || renameFish.isPending || sellFish.isPending || favorite.isPending}
          error={feed.error?.message ?? renameFish.error?.message ?? sellFish.error?.message ?? favorite.error?.message}
          onClose={() => setSelectedFishId(null)}
          onFeed={(foodType, quantity) => feed.mutate({ fishId: selectedFish.id, foodType, quantity })}
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

function InventorySummary({
  activeFish,
  capacity,
  totalItems,
  activeDecor
}: {
  activeFish: number;
  capacity: number;
  totalItems: number;
  activeDecor: number;
}) {
  const fishPercent = Math.min(100, Math.round((activeFish / capacity) * 100));
  return (
    <Panel className="grid grid-cols-3 gap-2 overflow-hidden rounded-[18px] border-cyan-100/18 p-3">
      <SummaryCell icon={<Fish className="h-5 w-5" />} label="Рыбы в аквариуме" value={`${activeFish}/${capacity}`} detail={<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-950/55"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${fishPercent}%` }} /></div>} tone="cyan" />
      <SummaryCell icon={<Box className="h-5 w-5" />} label="Всего предметов" value={String(totalItems)} detail="4 категории" tone="amber" />
      <SummaryCell icon={<CalendarDays className="h-5 w-5" />} label="Активный декор" value={String(activeDecor)} detail="предмета" tone="blue" />
    </Panel>
  );
}

function SummaryCell({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: ReactNode; tone: "cyan" | "amber" | "yellow" | "blue" }) {
  const toneClass = {
    cyan: "bg-cyan-300/16 text-cyan-100",
    amber: "bg-amber-300/16 text-amber-100",
    yellow: "bg-yellow-300/16 text-yellow-100",
    blue: "bg-sky-300/16 text-sky-100"
  }[tone];
  return (
    <div className="min-w-0 border-r border-cyan-100/8 px-1 last:border-r-0">
      <div className={cn("mb-2 grid h-9 w-9 place-items-center rounded-xl", toneClass)}>{icon}</div>
      <div className="line-clamp-2 min-h-8 text-[10px] leading-4 text-cyan-100/68">{label}</div>
      <div className="mt-1 truncate text-xl font-black text-cyan-50">{value}</div>
      <div className="mt-1 min-h-4 truncate text-[11px] text-cyan-100/74">{detail}</div>
    </div>
  );
}

function InventoryCategoryCard({
  tab,
  title,
  subtitle,
  image,
  accent,
  badge,
  icon: Icon,
  onClick
}: {
  tab: InventoryTab;
  title: string;
  subtitle: string;
  image: string;
  accent: string;
  badge: string;
  icon: typeof Package;
  onClick: () => void;
}) {
  const toneClass = tab === "food" ? "border-amber-200/26" : tab === "backgrounds" ? "border-violet-200/26" : "border-cyan-100/20";
  return (
    <button
      className={cn("group relative grid min-h-36 grid-cols-[104px_minmax(0,1fr)_40px] items-center gap-3 overflow-hidden rounded-[24px] border bg-[linear-gradient(125deg,rgba(12,58,76,.94),rgba(6,29,48,.9)_52%,rgba(3,18,32,.96))] p-3 text-left shadow-[0_20px_54px_rgba(0,0,0,.32),inset_0_0_0_1px_rgba(103,232,249,.1)] transition active:scale-[.98]", toneClass)}
      onClick={onClick}
      type="button"
    >
      <div className="absolute inset-0 opacity-90" style={{ background: `radial-gradient(circle at 70% 45%, ${accent}28, transparent 42%)` }} />
      <div className="relative z-20 grid h-28 w-[104px] place-items-center rounded-[20px] border border-white/10 bg-slate-950/24">
        <span className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-xl text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,.14)]" style={{ backgroundColor: `${accent}32` }}>
          <Icon className="h-6 w-6" />
        </span>
        <img className="h-24 w-24 object-contain object-center drop-shadow-[0_18px_24px_rgba(0,0,0,.48)] transition duration-200 group-active:scale-95" src={image} alt="" />
      </div>
      <div className="relative z-10 min-w-0 self-stretch py-2">
        <span className="inline-flex rounded-full bg-slate-950/42 px-2.5 py-1 text-[10px] font-black text-cyan-50/88">{badge}</span>
        <div className="mt-3 break-words text-xl font-black leading-tight text-cyan-50 text-glow">{title}</div>
        <div className="mt-1.5 line-clamp-3 text-xs leading-5 text-cyan-100/72">{subtitle}</div>
      </div>
      <span className="relative z-20 grid h-10 w-10 place-items-center rounded-2xl text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,.16)]" style={{ backgroundColor: `${accent}32` }}>
        <ChevronRight className="h-5 w-5" />
      </span>
    </button>
  );
}

function BreedingItemsSection({ inventory }: { inventory?: AquariumSnapshot["inventory"] }) {
  const items = [
    { title: "Нерестовое гнездо", description: "Запускает одно скрещивание", count: inventory?.spawningNest ?? 0, image: AppAssets.care.spawningNest },
    { title: "Инкубатор икры", description: "Ускоряет икру на 1 час", count: inventory?.eggIncubator ?? 0, image: AppAssets.care.eggIncubator },
    { title: "Корм для мальков", description: "Ускоряет взросление на 2 часа", count: inventory?.fryFood ?? 0, image: AppAssets.care.fryFood },
    { title: "Кондиционер питомника", description: "Запас ухода за молодняком", count: inventory?.nurseryConditioner ?? 0, image: AppAssets.care.nurseryConditioner },
    { title: "Медальон родословной", description: "Предмет для истории поколений", count: inventory?.genealogyMedallion ?? 0, image: AppAssets.care.genealogyMedallion }
  ];
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => <div key={item.title} className="grid min-h-36 grid-cols-[96px_1fr] items-center gap-3 rounded-[22px] border border-amber-200/16 bg-slate-950/32 p-3"><img className="h-24 w-24 object-contain" src={item.image} alt="" /><div className="min-w-0"><div className="text-3xl font-black text-amber-100">{item.count}</div><div className="font-black text-cyan-50">{item.title}</div><div className="mt-1 text-xs leading-4 text-cyan-100/60">{item.description}</div></div></div>)}</div>;
}

function FoodSection({ inventory, pollution, isBusy, onClean }: { inventory?: AquariumSnapshot["inventory"]; pollution: number; isBusy: boolean; onClean: (superClean: boolean) => void }) {
  const items = [
    { title: "Обычный корм", detail: "Для выбранной рыбы", count: inventory?.food ?? 0, image: AppAssets.care.foodBasic, tone: "from-amber-300/14" },
    { title: "Большой корм", detail: "−100 голода", count: inventory?.bigFood ?? 0, image: AppAssets.care.foodPremium, tone: "from-orange-300/14" },
    { title: "Суперкорм", detail: "Кормит весь аквариум", count: inventory?.superFood ?? 0, image: AppAssets.care.foodPremium, tone: "from-emerald-300/14" }
  ];
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => <div key={item.title} className={`relative grid min-h-28 grid-cols-[92px_1fr] items-center gap-3 overflow-hidden rounded-[22px] border border-cyan-100/12 bg-gradient-to-r ${item.tone} to-slate-950/48 p-3`}><img className="h-20 w-20 object-contain" src={item.image} alt="" /><div><div className="text-2xl font-black text-cyan-50">{item.count}</div><div className="font-black text-cyan-50">{item.title}</div><div className="text-xs text-cyan-100/60">{item.detail}</div></div></div>)}
      <div className="grid grid-cols-2 gap-3">
        <button className="rounded-[22px] border border-cyan-100/12 bg-cyan-300/10 p-3 text-left disabled:opacity-45" disabled={isBusy || (inventory?.cleaner ?? 0) <= 0 || pollution <= 0} onClick={() => onClean(false)}><img className="mx-auto h-16 w-16 object-contain" src={AppAssets.care.waterConditioner} alt="" /><div className="font-black">Очистить −15</div><div className="text-xs text-cyan-100/60">Осталось: {inventory?.cleaner ?? 0}</div></button>
        <button className="rounded-[22px] border border-emerald-100/16 bg-emerald-300/10 p-3 text-left disabled:opacity-45" disabled={isBusy || (inventory?.superCleaner ?? 0) <= 0 || pollution <= 0} onClick={() => onClean(true)}><img className="mx-auto h-16 w-16 object-contain" src={AppAssets.care.waterConditioner} alt="" /><div className="font-black">Суперочистка</div><div className="text-xs text-cyan-100/60">До 0 · {inventory?.superCleaner ?? 0}</div></button>
      </div>
      <div className="text-center text-xs text-cyan-100/55">Загрязнение аквариума: {pollution}</div>
    </div>
  );
}

function DecorSection({ products, activeDecor, isBusy, onToggle }: { products: ShopProduct[]; activeDecor: string[]; isBusy: boolean; onToggle: (product: ShopProduct, enabled: boolean) => void }) {
  if (!products.length) return <EmptyInventory title="Декор не куплен" text="Купи растения, пузыри или украшения в магазине, и они появятся здесь." />;
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => {
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
  if (!products.length) return <EmptyInventory title="Фоны не куплены" text="После покупки фона в магазине он появится в этом разделе." />;
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

function EmptyInventory({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-cyan-100/12 bg-slate-950/32 p-5 text-center shadow-[0_18px_54px_rgba(0,0,0,.22)]">
      <div className="text-lg font-black text-cyan-50">{title}</div>
      <div className="mt-2 text-sm text-cyan-100/62">{text}</div>
    </div>
  );
}

function FishSection({ fishList, capacity, superFood, isFeeding, onFeedAll, onFavorite, onSelect }: { fishList: FishView[]; capacity: number; superFood: number; isFeeding: boolean; onFeedAll: () => void; onFavorite: (fish: FishView) => void; onSelect: (fish: FishView) => void }) {
  return (
    <div className="space-y-3">
      <Panel className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-cyan-100/72">
          <Waves className="h-4 w-4" /> Вместимость
        </div>
        <div className={cn("text-sm font-black", fishList.length > capacity ? "text-rose-200" : "text-cyan-50")}>{fishList.length}/{capacity}</div>
      </Panel>
      <Button className="h-12 w-full bg-gradient-to-r from-amber-300 to-emerald-300 text-slate-950 shadow-[0_0_28px_rgba(110,231,183,.2)]" disabled={isFeeding || superFood <= 0 || !fishList.length} onClick={onFeedAll}>
        <Utensils className="h-4 w-4" /> Покормить всех рыб · суперкорм {superFood}
      </Button>
      <div className="grid grid-cols-1 gap-3">
        {fishList.map((fish, index) => {
          const overCapacity = index >= capacity;
          return (
            <div key={fish.id} className={cn("relative grid min-h-40 grid-cols-[120px_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-[24px] border p-3 text-left shadow-[0_20px_56px_rgba(0,0,0,.28)]", overCapacity ? "border-rose-300/35 bg-gradient-to-r from-rose-500/16 to-slate-950/54" : "border-cyan-100/16 bg-[linear-gradient(125deg,rgba(20,100,112,.2),rgba(5,27,44,.84)_58%,rgba(2,16,29,.94))]")}>
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: fish.glowColor + "24" }} />
              <button className={cn("absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-xl bg-slate-950/42 text-cyan-100", fish.isFavorite && "bg-rose-300 text-slate-950")} onClick={() => onFavorite(fish)} aria-label="Избранное">
                <Heart className={cn("h-4 w-4", fish.isFavorite && "fill-current")} />
              </button>
              <div className="relative z-10 grid h-32 w-[120px] place-items-center rounded-[20px] border border-white/10 bg-slate-950/22">
                <img className="h-28 w-28 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,.4)]" src={fishVisualAsset(fish)} alt="" />
              </div>
              <div className="relative z-10 min-w-0 self-stretch pb-11 pt-10">
                <div className="break-words text-lg font-black leading-tight text-cyan-50">{fish.name}</div>
                <span className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide" style={{ color: fish.rarityColor, borderColor: `${fish.rarityColor}66`, backgroundColor: `${fish.rarityColor}22`, boxShadow: `0 0 18px ${fish.rarityColor}22` }}>{overCapacity ? "Перенаселение" : fish.rarityLabel}</span>
                <div className="mt-1 line-clamp-2 text-xs leading-4 text-cyan-100/58">{fish.displayName}</div>
                <div className={cn("mt-3 text-xs", overCapacity ? "text-rose-100/80" : "text-cyan-100/72")}>{overCapacity ? "Можно заселить после расширения" : "Сытость " + fullness(fish) + "/" + fish.maxHunger}</div>
              </div>
              <Button className="absolute bottom-3 right-3 z-20 h-9 rounded-xl border border-cyan-200/35 bg-cyan-300/24 px-4 text-[11px] font-black text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,.22)]" onClick={() => onSelect(fish)}>
                  <Info className="h-3.5 w-3.5" /> Инфо
                </Button>
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
  bigFood,
  superFood,
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
  bigFood: number;
  superFood: number;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onFeed: (foodType: "basic" | "large" | "aquarium", quantity: number) => void;
  onRename: (name: string) => void;
  onFavorite: () => void;
  onSell: () => void;
}) {
  const [name, setName] = useState(fish.name);
  const [showFeedPicker, setShowFeedPicker] = useState(false);
  const [feedQuantity, setFeedQuantity] = useState(1);
  const [feedingDrop, setFeedingDrop] = useState<{ key: number; x: number } | null>(null);
  const fishFullness = fullness(fish);
  const fullnessPercent = Math.max(0, Math.min(100, (fishFullness / fish.maxHunger) * 100));
  const birthday = new Date(fish.birthday).toLocaleDateString("ru-RU");
  const previewFish = useMemo<FishView>(() => {
    if (!feedingDrop) return fish;
    return {
      ...fish,
      id: `${fish.id}-feed-${feedingDrop.key}`,
      animationState: {
        x: feedingDrop.x >= 50 ? Math.max(0.14, feedingDrop.x / 100 - 0.14) : Math.min(0.86, feedingDrop.x / 100 + 0.14),
        y: 0.66,
        targetX: feedingDrop.x / 100,
        targetY: 0.66,
        direction: feedingDrop.x >= 50 ? 1 : -1,
        targetLockSeconds: 1.25,
        speedMultiplier: 1.9,
        burstSeconds: 0
      }
    };
  }, [feedingDrop, fish]);

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(name);
  }

  function handleFeed(foodType: "basic" | "large" | "aquarium", quantity: number) {
    const x = 22 + Math.random() * 56;
    const key = Date.now();
    setFeedingDrop({ key, x });
    window.setTimeout(() => onFeed(foodType, quantity), 900);
    setShowFeedPicker(false);
    window.setTimeout(() => setFeedingDrop((current) => current?.key === key ? null : current), 1250);
  }

  return (
    <div data-app-modal="true" className="fixed inset-0 z-[220] grid place-items-end bg-slate-950/72 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)] sm:place-items-center">
      <div className="glass max-h-[calc(100dvh-96px-var(--safe-top)-var(--safe-bottom))] w-full min-w-0 max-w-[calc(100dvw-1.5rem)] space-y-4 overflow-y-auto overflow-x-hidden rounded-2xl p-4 shadow-2xl sm:max-w-md">
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
          <AquariumRenderer key={feedingDrop?.key ?? fish.id} fish={[previewFish]} className="h-full min-h-0 rounded-none" backgroundId="deep-lagoon" decor={[]} pollution={0} />
          {feedingDrop ? (
            <div key={feedingDrop.key} className="pointer-events-none absolute inset-0 z-20">
              <span
                className="absolute h-3 w-3 animate-[feed-drop_900ms_ease-in_forwards] rounded-full bg-amber-200 shadow-[0_0_12px_rgba(253,230,138,.9)]"
                style={{ left: `${feedingDrop.x}%`, top: "7%" }}
              />
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
          <Button className="bg-emerald-300" disabled={isBusy || fish.hunger <= 0 || food + bigFood + superFood <= 0} onClick={() => setShowFeedPicker(true)}>
            <Utensils className="h-4 w-4" /> Покормить
          </Button>
          <Button className={cn(fish.isFavorite && "bg-rose-300")} disabled={isBusy} onClick={onFavorite}>
            <Heart className={cn("h-4 w-4", fish.isFavorite && "fill-current")} /> Избранное
          </Button>
        </div>
        {showFeedPicker ? <div className="rounded-2xl border border-emerald-200/20 bg-slate-950/55 p-3"><div className="mb-3 font-black text-cyan-50">Выберите корм</div><div className="grid gap-2"><div className="flex items-center gap-2"><Button disabled={feedQuantity <= 1} onClick={() => setFeedQuantity((value) => value - 1)}>−</Button><span className="min-w-8 text-center font-black">{feedQuantity}</span><Button disabled={feedQuantity >= Math.min(10, food)} onClick={() => setFeedQuantity((value) => value + 1)}>+</Button><Button className="flex-1" disabled={food < feedQuantity} onClick={() => handleFeed("basic", feedQuantity)}>Обычный ×{feedQuantity} · −{feedQuantity * 25}</Button></div><Button disabled={!bigFood} onClick={() => handleFeed("large", 1)}>Большой корм · −100 голода ({bigFood})</Button><Button disabled={!superFood} onClick={() => handleFeed("aquarium", 1)}>Суперкорм · накормить всех ({superFood})</Button></div></div> : null}
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
