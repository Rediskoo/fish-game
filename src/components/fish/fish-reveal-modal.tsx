"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Coins, Fish, Pencil, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playTone } from "@/stores/sound-store";
import type { AcquiredFish, CaseResult } from "@/types/game";

function rarityGlow(rarity: string) {
  if (rarity === "LEGENDARY") return "shadow-[0_0_80px_rgba(251,191,36,.45)]";
  if (rarity === "EPIC") return "shadow-[0_0_70px_rgba(185,135,255,.36)]";
  if (rarity === "RARE") return "shadow-[0_0_60px_rgba(99,255,179,.28)]";
  return "shadow-[0_0_50px_rgba(103,232,249,.22)]";
}

export function CaseRevealModal({
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
  const [settled, setSettled] = useState(false);
  const [started, setStarted] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(0);
  const [name, setName] = useState(result.fish.name);
  const itemHeight = 88;
  const reels = useMemo(
    () =>
      [0, 1, 2].map((reel) => {
        const items = result.tape.slice(reel * 5, reel * 5 + 8);
        return [
          ...items,
          {
            key: `winner-${reel}-${result.fish.id}`,
            displayName: result.fish.displayName,
            rarity: result.fish.rarity,
            rarityLabel: result.fish.rarityLabel,
            rarityColor: result.fish.rarityColor,
            color: result.fish.color,
            glowColor: result.fish.glowColor
          }
        ];
      }),
    [result]
  );

  useEffect(() => {
    if (!started) return;

    const stopTimers = [0, 1, 2].map((reel) =>
      window.setTimeout(() => {
        setStoppedReels(reel + 1);
        playTone(reel === 2 && result.fish.rarity !== "COMMON" ? "rare" : "roulette");
      }, 1100 + reel * 520)
    );
    const settleTimer = window.setTimeout(() => setSettled(true), 2900);

    let tick = 0;
    const tickTimer = window.setInterval(() => {
      tick += 1;
      playTone("roulette");
      if (tick > 9) window.clearInterval(tickTimer);
    }, 170);

    return () => {
      stopTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(settleTimer);
      window.clearInterval(tickTimer);
    };
  }, [result.fish.rarity, started]);

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length >= 2 && name.trim() !== result.fish.name) onRename(name.trim());
  }

  if (settled) {
    return (
      <FishRevealModal
        fish={{ ...result.fish, name }}
        isBusy={isBusy}
        error={error}
        onClose={onClose}
        onSell={onSell}
        onRename={onRename}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/82 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)] sm:place-items-center">
      <div className="glass relative w-full max-w-md overflow-hidden rounded-2xl p-4 text-center shadow-2xl">
        <button
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100 disabled:opacity-40"
          disabled={started}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-slate-950/45 px-3 py-1 text-xs font-bold uppercase text-amber-100">
          <Sparkles className="h-4 w-4" /> Рыбное казино
        </div>

        <div className="mb-4 text-3xl font-black tracking-normal text-cyan-50 text-glow">777</div>

        <div className="relative grid h-36 grid-cols-3 gap-2 overflow-hidden rounded-xl border border-amber-200/25 bg-slate-950/55 p-2 shadow-[inset_0_0_32px_rgba(251,191,36,.08)]">
          <div className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-[88px] -translate-y-1/2 rounded-xl border-y-2 border-amber-200/85 bg-amber-200/5 shadow-[0_0_30px_rgba(251,191,36,.2)]" />
          {reels.map((items, reelIndex) => (
            <div key={reelIndex} className="relative overflow-hidden rounded-xl bg-slate-900/80">
              <div
                className="absolute inset-x-0 top-6 transition-transform"
                style={{
                  transform: started ? `translateY(-${(items.length - 1) * itemHeight}px)` : "translateY(0px)",
                  transitionDuration: `${1200 + reelIndex * 520}ms`,
                  transitionTimingFunction: "cubic-bezier(.08,.8,.12,1)"
                }}
              >
                {items.map((item) => (
                  <div key={item.key} className="mx-auto grid h-[88px] w-full place-items-center px-2">
                    <div className="grid h-16 w-full place-items-center rounded-lg border border-white/10" style={{ backgroundColor: `${item.glowColor}22` }}>
                      <Fish className="h-9 w-9 drop-shadow-[0_0_12px_currentColor]" style={{ color: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              {started && stoppedReels > reelIndex ? (
                <div className="pointer-events-none absolute inset-0 rounded-xl border border-amber-200/65 shadow-[0_0_18px_rgba(251,191,36,.24)]" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-slate-950/35 p-3">
          <div className="text-sm font-bold text-cyan-50">{started ? "Барабаны останавливаются по очереди" : "Кейс куплен. Нажми, чтобы запустить барабаны."}</div>
          <div className="mt-1 text-xs text-cyan-100/55">Все три окна остановятся на выпавшей рыбке.</div>
        </div>

        <Button className="mt-4 w-full bg-amber-300" disabled={started} onClick={() => setStarted(true)}>
          <Sparkles className="h-4 w-4" /> Крутить
        </Button>

        <form className="sr-only" onSubmit={handleRename}>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </form>
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
    <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/78 px-3 pb-[calc(14px+var(--safe-bottom))] pt-[var(--safe-top)] sm:place-items-center">
      <div className="glass relative max-h-[calc(100dvh-28px-var(--safe-top)-var(--safe-bottom))] w-full max-w-md overflow-y-auto rounded-2xl p-4 text-center shadow-2xl">
        <button
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-slate-950/40 px-3 py-1 text-xs font-bold uppercase text-cyan-100/75">
            <Sparkles className="h-4 w-4" /> Новая рыбка
          </div>

          <div className={`mx-auto grid h-44 w-44 place-items-center rounded-2xl border border-white/10 bg-slate-950/35 ${rarityGlow(fish.rarity)}`}>
            <Fish className="h-28 w-28 drop-shadow-[0_0_18px_currentColor]" style={{ color: fish.color }} />
          </div>

          <div>
            <h2 className="text-3xl font-black text-cyan-50 text-glow">{fish.displayName}</h2>
            <p className="mt-1 text-sm font-bold" style={{ color: fish.rarityColor }}>
              {fish.rarityLabel} · +{fish.incomePerSecond.toFixed(1)}/сек
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm text-cyan-50/85">{fish.description || fish.message}</p>
          </div>

          <form className="flex gap-2" onSubmit={handleRename}>
            <input
              className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35 focus:border-cyan-200/45"
              maxLength={18}
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button disabled={isBusy || !onRename || name.trim().length < 2 || name.trim() === fish.name} type="submit" aria-label="Переименовать">
              <Pencil className="h-4 w-4" />
            </Button>
          </form>

          <div className="grid grid-cols-2 gap-2 text-left text-sm">
            <Info label="Возраст" value="новенькая" />
            <Info label="Рождение" value={birthday} />
            <Info label="Характер" value={fish.personalityLabel} />
            <Info label="Шанс" value={`${(fish.dropChanceBps / 100).toFixed(2)}%`} />
          </div>

          {error ? <p className="text-sm text-yellow-100">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-emerald-300" disabled={isBusy} onClick={onClose}>
              <Sparkles className="h-4 w-4" /> Поселить
            </Button>
            <Button className="bg-amber-300" disabled={isBusy} onClick={onSell}>
              <Coins className="h-4 w-4" /> Продать · 50
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
