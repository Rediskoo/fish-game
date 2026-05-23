"use client";

import { Coins, Fish, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AcquiredFish } from "@/types/game";

const rarityLabel: Record<string, string> = {
  COMMON: "Обычная",
  RARE: "Редкая",
  EPIC: "Эпическая",
  LEGENDARY: "Легендарная"
};

export function FishRevealModal({
  fish,
  isBusy,
  error,
  onClose,
  onSell
}: {
  fish: AcquiredFish;
  isBusy?: boolean;
  error?: string;
  onClose: () => void;
  onSell: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/78 px-4 py-[calc(18px+var(--safe-top))]">
      <div className="glass relative w-full max-w-md overflow-hidden rounded-2xl p-4 text-center shadow-2xl">
        <div
          className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full opacity-35"
          style={{
            background: `repeating-conic-gradient(from 0deg, ${fish.glowColor} 0deg 10deg, transparent 10deg 22deg)`
          }}
        />
        <button
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/45 text-cyan-100"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-slate-950/40 px-3 py-1 text-xs font-bold uppercase text-cyan-100/75">
            <Sparkles className="h-4 w-4" /> Новая рыбка
          </div>

          <div className="mx-auto grid h-40 w-40 place-items-center rounded-full border border-white/10 bg-slate-950/35 shadow-[0_0_70px_rgba(103,232,249,.25)]">
            <Fish className="h-24 w-24 drop-shadow-[0_0_18px_currentColor]" style={{ color: fish.color }} />
          </div>

          <div>
            <h2 className="text-3xl font-black text-cyan-50 text-glow">{fish.displayName}</h2>
            <p className="mt-1 text-sm text-cyan-100/70">
              {rarityLabel[fish.rarity]} · шанс {(fish.dropChanceBps / 100).toFixed(1)}%
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm text-cyan-50/85">{fish.message}</p>
          </div>

          {error ? <p className="text-sm text-yellow-100">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-emerald-300" disabled={isBusy} onClick={onClose}>
              <Sparkles className="h-4 w-4" /> Забрать
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
