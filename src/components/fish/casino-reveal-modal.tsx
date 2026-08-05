"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Coins, Fish, Pencil, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playTone } from "@/stores/sound-store";
import type { AcquiredFish, CaseResult } from "@/types/game";

function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern);
}

export function CasinoRevealModal({
  result,
  isBusy,
  error,
  onClose,
  onSell,
  onRename
}: {
  result: CaseResult;
  isBusy?: boolean;
  error?: string;
  onClose: () => void;
  onSell: () => void;
  onRename: (name: string) => void;
}) {
  const [started, setStarted] = useState(false);
  const [settled, setSettled] = useState(false);
  const itemWidth = 104;
  const centerOffset = 160;
  const targetX = result.winningIndex * itemWidth - centerOffset;

  useEffect(() => {
    if (!started) return;
    const tick = window.setInterval(() => playTone("roulette"), 145);
    const slowTick = window.setInterval(() => {
      vibrate(10);
      playTone(result.reward.fish.rarity === "LEGENDARY" || result.reward.fish.rarity === "EPIC" ? "rare" : "roulette");
    }, 520);
    const settleTimer = window.setTimeout(() => {
      window.clearInterval(tick);
      window.clearInterval(slowTick);
      setSettled(true);
      vibrate([70, 45, 120]);
      playTone("fish");
    }, result.durationMs + 300);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(slowTick);
      window.clearTimeout(settleTimer);
    };
  }, [result.durationMs, result.reward.fish.rarity, started]);

  if (settled) {
    return (
      <FishRevealModal
        fish={result.reward.fish}
        isBusy={isBusy}
        error={error}
        onClose={onClose}
        onSell={onSell}
        onRename={onRename}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/82 p-3">
      <div className="glass relative w-full max-w-md overflow-hidden rounded-2xl p-4 text-center shadow-2xl">
        <button
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100 disabled:opacity-40"
          disabled={started}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase text-cyan-100">
          <Sparkles className="h-4 w-4" /> Рыбный кейс
        </div>
        <h2 className="mb-4 text-2xl font-black text-cyan-50">Открой кейс</h2>

        <div className="relative h-40 overflow-hidden rounded-2xl bg-slate-950/60">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[106px] -translate-x-1/2 rounded-2xl border-2 border-cyan-100/80 shadow-[0_0_30px_rgba(103,232,249,.42)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-950 to-transparent" />
          <div
            className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-3 transition-transform"
            style={{
              transform: started ? `translateX(calc(-50% - ${targetX}px))` : "translateX(-50%)",
              transitionDuration: `${result.durationMs}ms`,
              transitionTimingFunction: "cubic-bezier(.08,.82,.1,1)"
            }}
          >
            {result.tape.map((item, index) => {
              const isWinner = index === result.winningIndex;
              return (
                <div
                  key={item.key}
                  className="grid h-32 w-[92px] shrink-0 place-items-center rounded-2xl border border-white/10 bg-slate-900/80 p-2"
                  style={{
                    boxShadow: started && isWinner ? `0 0 34px ${item.glowColor}66` : undefined
                  }}
                >
                  <Fish className="h-12 w-12 drop-shadow-[0_0_12px_currentColor]" style={{ color: item.color }} />
                  <div className="mt-2 w-full truncate text-xs font-bold text-cyan-50">{item.displayName}</div>
                  <div className="text-[10px] font-bold" style={{ color: item.rarityColor }}>
                    {item.rarityLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 min-h-10 text-sm font-medium text-cyan-100/75">
          {started ? "Лента замедляется и остановится на серверной рыбе." : "Стоимость открытия: 100 водорослей. Рыба сразу попадает в аквариум."}
        </p>
        <Button
          className="mt-3 w-full"
          disabled={started}
          onClick={() => {
            setStarted(true);
            vibrate(20);
            playTone("roulette");
          }}
        >
          <Sparkles className="h-4 w-4" /> Открыть кейс
        </Button>
      </div>
    </div>
  );
}

export function FishRevealModal({
  fish,
  isBusy,
  error,
  onClose,
  onSell,
  onRename
}: {
  fish: AcquiredFish;
  isBusy?: boolean;
  error?: string;
  onClose: () => void;
  onSell: () => void;
  onRename?: (name: string) => void;
}) {
  const [name, setName] = useState(fish.name);
  const birthday = useMemo(() => new Date(fish.birthday).toLocaleDateString("ru-RU"), [fish.birthday]);

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length >= 2 && name.trim() !== fish.name) onRename?.(name.trim());
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/78 p-3">
      <div className="glass relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl p-5 text-center shadow-2xl">
        <button className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100" onClick={onClose} aria-label="Закрыть">
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase text-cyan-100">
            <Sparkles className="h-4 w-4" /> Новая рыбка
          </div>
          <div
            className="mx-auto grid h-44 w-44 animate-[casino-prize_.55s_ease-out] place-items-center rounded-2xl bg-slate-950/35 shadow-[0_0_70px_var(--fish-glow)]"
            style={{ "--fish-glow": `${fish.glowColor}88` } as CSSProperties}
          >
            <Fish className="h-28 w-28 drop-shadow-[0_0_18px_currentColor]" style={{ color: fish.color }} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-cyan-50 text-glow">{fish.displayName}</h2>
            <p className="mt-1 text-sm font-bold" style={{ color: fish.rarityColor }}>
              {fish.rarityLabel} · +{fish.incomePerSecond.toFixed(1)}/сек
            </p>
          </div>
          <form className="flex gap-2" onSubmit={handleRename}>
            <input
              className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none"
              maxLength={18}
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button className="h-11 w-11 shrink-0 px-0" disabled={isBusy || !onRename || name.trim().length < 2 || name.trim() === fish.name} type="submit" aria-label="Переименовать">
              <Pencil className="h-4 w-4" />
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-2 text-left text-sm">
            <Info label="Возраст" value="новенькая" />
            <Info label="Рождение" value={birthday} />
            <Info label="Характер" value={fish.personalityLabel} />
            <Info label="Шанс" value={`${(fish.dropChanceBps / 100).toFixed(2)}%`} />
          </div>
          <p className="text-left text-sm text-cyan-50/75">{fish.description}</p>
          {error ? <p className="text-sm text-yellow-100">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-emerald-300" disabled={isBusy} onClick={onClose}>
              Поселить
            </Button>
            <Button className="bg-amber-300" disabled={isBusy} onClick={onSell}>
              <Coins className="h-4 w-4" /> Продать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/30 p-3">
      <div className="text-xs text-cyan-100/55">{label}</div>
      <div className="mt-1 truncate font-bold text-cyan-50">{value}</div>
    </div>
  );
}
