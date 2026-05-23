"use client";

import { FormEvent, useMemo, useState } from "react";
import { Info, Pencil, Trash2, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";
import { useRenameFish, useSellFish } from "@/features/inventory/use-fish-actions";
import { useFeedFish } from "@/features/inventory/use-feed-fish";
import type { FishView } from "@/types/game";

const rarityLabel: Record<string, string> = {
  COMMON: "Обычная",
  RARE: "Редкая",
  EPIC: "Эпическая",
  LEGENDARY: "Легендарная"
};

function formatAge(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} д. ${hours} ч.`;
  if (hours > 0) return `${hours} ч. ${minutes} мин.`;
  return `${minutes} мин.`;
}

function fullness(fish: FishView) {
  return Math.max(0, fish.maxHunger - fish.hunger);
}

export function InventoryScreen() {
  const player = usePlayer();
  const feed = useFeedFish();
  const renameFish = useRenameFish();
  const sellFish = useSellFish();
  const food = player.data?.inventory.food ?? 0;
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const selectedFish = useMemo(
    () => player.data?.fish.find((fish) => fish.id === selectedFishId) ?? null,
    [player.data?.fish, selectedFishId]
  );

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
            <div className="text-2xl font-black">{food}</div>
            <div className="text-sm text-cyan-100/60">корма в инвентаре</div>
          </div>
        </div>
      </Panel>

      <div className="glass pointer-events-auto rounded-2xl p-3 text-sm text-cyan-50/80">
        <span className="font-semibold text-cyan-100">+{(player.data?.incomePerSecond ?? 0).toFixed(1)}/сек</span>
        <span className="ml-2 text-cyan-100/55">начисляется, когда ты возвращаешься в игру</span>
      </div>

      <div className="grid gap-3">
        {player.data?.fish.map((fish) => (
          <Panel key={fish.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-bold">{fish.name}</div>
              <div className="text-sm text-cyan-100/60">
                Сытость {fullness(fish)}/{fish.maxHunger} · голод {fish.hunger}
              </div>
            </div>
            <Button onClick={() => setSelectedFishId(fish.id)} aria-label={`Подробнее о ${fish.name}`}>
              <Info className="h-4 w-4" />
            </Button>
          </Panel>
        ))}
      </div>

      {selectedFish ? (
        <FishModal
          fish={selectedFish}
          food={food}
          isBusy={feed.isPending || renameFish.isPending || sellFish.isPending}
          error={feed.error?.message ?? renameFish.error?.message ?? sellFish.error?.message}
          onClose={() => setSelectedFishId(null)}
          onFeed={() => feed.mutate(selectedFish.id)}
          onRename={(name) => renameFish.mutate({ fishId: selectedFish.id, name })}
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
  onSell
}: {
  fish: FishView;
  food: number;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onFeed: () => void;
  onRename: (name: string) => void;
  onSell: () => void;
}) {
  const [name, setName] = useState(fish.name);
  const fishFullness = fullness(fish);
  const fullnessPercent = Math.max(0, Math.min(100, (fishFullness / fish.maxHunger) * 100));

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(name);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/70 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)]">
      <div className="glass w-full max-w-md space-y-4 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-2xl font-black text-cyan-50">{fish.name}</div>
            <div className="text-sm text-cyan-100/60">{rarityLabel[fish.rarity]} · {fish.typeName}</div>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/40 text-cyan-100" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <InfoRow label="Доход" value={`+${fish.incomePerSecond.toFixed(1)}/сек`} />
          <InfoRow label="Возраст" value={formatAge(fish.ageSeconds)} />
          <InfoRow label="Тип" value={fish.typeName} />
          <div>
            <div className="mb-2 flex items-center justify-between text-cyan-100/70">
              <span>Сытость</span>
              <span>{fishFullness}/{fish.maxHunger}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-950/60">
              <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${fullnessPercent}%` }} />
            </div>
            <div className="mt-1 text-xs text-cyan-100/50">Голод: {fish.hunger} единиц</div>
          </div>
        </div>

        <Button className="w-full bg-emerald-300" disabled={isBusy || food <= 0 || fish.hunger <= 0} onClick={onFeed}>
          <Utensils className="h-4 w-4" /> Покормить
        </Button>

        {error ? <p className="text-sm text-yellow-100">{error}</p> : null}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <form className="flex min-w-0 gap-2" onSubmit={handleRename}>
            <input
              className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35 focus:border-cyan-200/45"
              maxLength={18}
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button disabled={isBusy || name.trim().length < 2 || name.trim() === fish.name} type="submit" aria-label="Переименовать">
              <Pencil className="h-4 w-4" />
            </Button>
          </form>
          <Button className="bg-rose-300" disabled={isBusy} onClick={onSell} aria-label="Продать за 50 водорослей">
            <Trash2 className="h-4 w-4" /> 50
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/30 px-3 py-2">
      <span className="text-cyan-100/60">{label}</span>
      <span className="min-w-0 truncate font-bold text-cyan-50">{value}</span>
    </div>
  );
}
