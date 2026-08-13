"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Coins, Fish, Pencil, Sparkles, Waves, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playTone } from "@/stores/sound-store";
import type { AcquiredFish, CaseResult } from "@/types/game";
import { vibrate } from "@/stores/preferences-store";

function rewardCopy(result: CaseResult) {
  if (result.reward.kind === "fish") return "Три одинаковые рыбки — новая рыбка уже в аквариуме!";
  return result.reward.amount === 100 ? "Две одинаковые рыбки — возвращаем 100 водорослей." : "Три разные рыбки — утешительный приз: 50 водорослей.";
}

export function CasinoRevealModal({ result, isBusy, error, onClose, onSell, onRename }: {
  result: CaseResult;
  isBusy?: boolean;
  error?: string;
  onClose: () => void;
  onSell: () => void;
  onRename: (name: string) => void;
}) {
  const [started, setStarted] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(0);
  const [settled, setSettled] = useState(false);
  const itemHeight = 82;
  const stopDelays = useMemo(() => [result.durationMs - 1800, result.durationMs - 900, result.durationMs], [result.durationMs]);

  useEffect(() => {
    if (!started) return;
    const timers = stopDelays.map((delay, index) => window.setTimeout(() => {
      setStoppedReels(index + 1);
      vibrate(index === 2 ? [35, 45, 85] : 30);
      playTone(index === 2 && result.reward.kind === "fish" ? "rare" : "roulette");
    }, delay));
    const ticker = window.setInterval(() => playTone("roulette"), 260);
    const settleTimer = window.setTimeout(() => {
      window.clearInterval(ticker);
      setSettled(true);
      if (result.reward.kind === "fish") {
        vibrate([70, 45, 120, 45, 180]);
        playTone("fish");
      }
    }, result.durationMs + 450);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(settleTimer);
      window.clearInterval(ticker);
    };
  }, [result.durationMs, result.reward.kind, started, stopDelays]);

  if (settled && result.reward.kind === "fish") {
    return <FishRevealModal fish={result.reward.fish} isBusy={isBusy} error={error} onClose={onClose} onSell={onSell} onRename={onRename} />;
  }

  if (settled) {
    return (
      <div data-app-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/80 p-3">
        <div className="glass w-full max-w-md animate-[casino-prize_.5s_ease-out] rounded-2xl p-6 text-center shadow-2xl">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-300/15 shadow-[0_0_52px_rgba(110,231,183,.32)]"><Waves className="h-12 w-12 text-emerald-200" /></div>
          <h2 className="mt-5 text-3xl font-black text-cyan-50 text-glow">+{result.reward.kind === "currency" ? result.reward.amount : 0} водорослей</h2>
          <p className="mt-2 text-sm text-cyan-100/75">{rewardCopy(result)}</p>
          <Button className="mt-6 w-full bg-emerald-300" onClick={onClose}>Забрать</Button>
        </div>
      </div>
    );
  }

  return (
    <div data-app-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/82 p-3">
      <div className="glass relative w-full max-w-md overflow-hidden rounded-2xl p-4 text-center shadow-2xl">
        <button className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100 disabled:opacity-40" disabled={started} onClick={onClose} aria-label="Закрыть"><X className="h-5 w-5" /></button>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase text-cyan-100"><Sparkles className="h-4 w-4" /> Рыбный кейс</div>
        <h2 className="mb-4 text-2xl font-black text-cyan-50">Поймай три одинаковых</h2>

        <div className="grid h-36 grid-cols-3 gap-2 rounded-2xl bg-slate-950/60 p-2">
          {result.reels.map((items, reelIndex) => {
            const stopped = stoppedReels > reelIndex;
            return <div key={reelIndex} className="relative overflow-hidden rounded-xl bg-slate-900/80">
              <div className="absolute inset-x-0 top-6 transition-transform" style={{ transform: started ? `translateY(-${(items.length - 1) * itemHeight - 14}px)` : "translateY(0)", transitionDuration: `${stopDelays[reelIndex]}ms`, transitionTimingFunction: "cubic-bezier(.08,.8,.1,1)" }}>
                {items.map((item) => <div key={item.key} className="grid h-[82px] place-items-center px-1"><div className="grid h-16 w-full place-items-center rounded-lg transition-all" style={{ backgroundColor: `${item.glowColor}22`, boxShadow: stopped && item.key === items.at(-1)?.key ? `0 0 24px ${item.glowColor}` : undefined }}><Fish className="h-9 w-9 drop-shadow-[0_0_12px_currentColor]" style={{ color: item.color }} /></div></div>)}
              </div>
              {stopped ? <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-cyan-200/70 shadow-[0_0_24px_rgba(103,232,249,.35)]" /> : null}
            </div>;
          })}
        </div>

        <p className="mt-4 min-h-10 text-sm font-medium text-cyan-100/75">{started ? stoppedReels === 3 ? rewardCopy(result) : "Барабаны замедляются…" : "3 одинаковые — рыбка · 2 одинаковые — 100 · разные — 50 водорослей"}</p>
        <Button className="mt-3 w-full" disabled={started} onClick={() => { setStarted(true); vibrate(20); playTone("roulette"); }}><Sparkles className="h-4 w-4" /> Крутить барабаны</Button>
      </div>
    </div>
  );
}

export function FishRevealModal({ fish, isBusy, error, onClose, onSell, onRename }: { fish: AcquiredFish; isBusy?: boolean; error?: string; onClose: () => void; onSell: () => void; onRename?: (name: string) => void }) {
  const [name, setName] = useState(fish.name);
  const birthday = useMemo(() => new Date(fish.birthday).toLocaleDateString("ru-RU"), [fish.birthday]);
  function handleRename(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (name.trim().length >= 2 && name.trim() !== fish.name) onRename?.(name.trim()); }
  return <div data-app-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/78 p-3"><div className="glass relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl p-5 text-center shadow-2xl">
    <button className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100" onClick={onClose} aria-label="Закрыть"><X className="h-5 w-5" /></button>
    <div className="space-y-4"><div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase text-cyan-100"><Sparkles className="h-4 w-4" /> Новая рыбка</div><div className="mx-auto grid h-44 w-44 animate-[casino-prize_.55s_ease-out] place-items-center rounded-2xl bg-slate-950/35 shadow-[0_0_70px_var(--fish-glow)]" style={{ "--fish-glow": `${fish.glowColor}88` } as React.CSSProperties}><Fish className="h-28 w-28 drop-shadow-[0_0_18px_currentColor]" style={{ color: fish.color }} /></div><div><h2 className="text-3xl font-black text-cyan-50 text-glow">{fish.displayName}</h2><p className="mt-1 text-sm font-bold" style={{ color: fish.rarityColor }}>{fish.rarityLabel} · +{fish.incomePerSecond.toFixed(1)}/сек</p></div>
      <form className="flex gap-2" onSubmit={handleRename}><input className="min-w-0 flex-1 rounded-xl border border-cyan-100/10 bg-slate-950/45 px-3 text-sm text-cyan-50 outline-none" maxLength={18} minLength={2} value={name} onChange={(event) => setName(event.target.value)} /><Button className="h-11 w-11 shrink-0 px-0" disabled={isBusy || !onRename || name.trim().length < 2 || name.trim() === fish.name} type="submit" aria-label="Переименовать"><Pencil className="h-4 w-4" /></Button></form>
      <div className="grid grid-cols-2 gap-2 text-left text-sm"><Info label="Возраст" value="новенькая" /><Info label="Рождение" value={birthday} /><Info label="Характер" value={fish.personalityLabel} /><Info label="Шанс" value={`${(fish.dropChanceBps / 100).toFixed(2)}%`} /></div>{error ? <p className="text-sm text-yellow-100">{error}</p> : null}<div className="grid grid-cols-2 gap-2"><Button className="bg-emerald-300" disabled={isBusy} onClick={onClose}>Поселить</Button><Button className="bg-amber-300" disabled={isBusy} onClick={onSell}><Coins className="h-4 w-4" /> Продать</Button></div>
    </div></div></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-950/30 p-3"><div className="text-xs text-cyan-100/55">{label}</div><div className="mt-1 truncate font-bold text-cyan-50">{value}</div></div>; }
