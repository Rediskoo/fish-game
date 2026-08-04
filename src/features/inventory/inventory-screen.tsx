"use client";

import { FormEvent, useMemo, useState } from "react";
import { Fish, Heart, Info, Pencil, Trash2, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useRenameFish, useSellFish, useToggleFavoriteFish } from "@/features/inventory/use-fish-actions";
import { useFeedFish } from "@/features/inventory/use-feed-fish";
import { cn } from "@/lib/cn";
import type { FishView } from "@/types/game";

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
  const player = usePlayer();
  const feed = useFeedFish();
  const renameFish = useRenameFish();
  const sellFish = useSellFish();
  const favorite = useToggleFavoriteFish();
  const food = player.data?.inventory.food ?? 0;
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const fishList = useMemo(() => [...(player.data?.fish ?? [])].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)), [player.data?.fish]);
  const selectedFish = useMemo(() => fishList.find((fish) => fish.id === selectedFishId) ?? null, [fishList, selectedFishId]);

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Корм и склад</h1>
      </header>

      <Panel>
        <div className="flex items-center gap-3">
          <Utensils className="h-6 w-6 text-emerald-200" />
          <div>
            <div className="text-2xl font-black">{food}</div>
            <div className="text-sm text-cyan-100/60">корма в инвентаре</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3">
        {fishList.map((fish) => (
          <Panel key={fish.id} className="flex items-center justify-between gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${fish.glowColor}22` }}>
              <Fish className="h-7 w-7" style={{ color: fish.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{fish.name}</div>
              <div className="text-sm text-cyan-100/60">
                {fish.rarityLabel} · сытость {fullness(fish)}/{fish.maxHunger}
              </div>
            </div>
            <Button className={cn("h-10 w-10 px-0", fish.isFavorite && "bg-rose-300")} onClick={() => favorite.mutate({ fishId: fish.id, isFavorite: !fish.isFavorite })} aria-label="Избранное">
              <Heart className={cn("h-4 w-4", fish.isFavorite && "fill-current")} />
            </Button>
            <Button className="h-10 w-10 px-0" onClick={() => setSelectedFishId(fish.id)} aria-label={`Подробнее о ${fish.name}`}>
              <Info className="h-4 w-4" />
            </Button>
          </Panel>
        ))}
      </div>



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
  const fishFullness = fullness(fish);
  const fullnessPercent = Math.max(0, Math.min(100, (fishFullness / fish.maxHunger) * 100));
  const birthday = new Date(fish.birthday).toLocaleDateString("ru-RU");

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(name);
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

        <div className="grid h-44 place-items-center rounded-2xl border border-white/10 bg-slate-950/35" style={{ boxShadow: `0 0 70px ${fish.glowColor}33` }}>
          <Fish className="h-28 w-28 drop-shadow-[0_0_18px_currentColor]" style={{ color: fish.color }} />
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
          <Button className="bg-emerald-300" disabled={isBusy || food <= 0 || fish.hunger <= 0} onClick={onFeed}>
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
