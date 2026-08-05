"use client";

import type { ReactNode } from "react";
import { Bell, Check, Smartphone, Sparkles, Volume2, Waves } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { useSoundStore } from "@/stores/sound-store";

export function SettingsScreen() {
  const sounds = useSoundStore();

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Настройки</h1>
        <p className="mt-2 text-sm text-cyan-100/62">Звук, отклики и поведение интерфейса.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatusTile icon={<Smartphone className="h-5 w-5" />} title="Telegram" value="fullscreen" tone="cyan" />
        <StatusTile icon={<Bell className="h-5 w-5" />} title="Отклики" value="включены" tone="amber" />
      </div>

      <Panel className="space-y-3 overflow-hidden border-cyan-200/18 bg-[linear-gradient(135deg,rgba(34,211,238,.13),rgba(16,185,129,.09),rgba(236,72,153,.08))]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-black text-cyan-50">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/18 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.16)]">
              <Volume2 className="h-5 w-5" />
            </span>
            <div>
              <div>Звуки</div>
              <div className="text-xs font-bold text-cyan-100/58">локально сохраняются на устройстве</div>
            </div>
          </div>
          <Waves className="h-5 w-5 text-cyan-100/45" />
        </div>
        <div className="grid gap-2">
          <Toggle label="Все звуки" detail="главный выключатель" checked={sounds.all} onChange={(value) => sounds.setSound("all", value)} />
          <Toggle label="Кнопки" detail="клики и подтверждения" checked={sounds.buttons} onChange={(value) => sounds.setSound("buttons", value)} />
          <Toggle label="Казино" detail="777, выигрыш и ожидание" checked={sounds.roulette} onChange={(value) => sounds.setSound("roulette", value)} />
          <Toggle label="Рыбки" detail="тапы и реакции рыб" checked={sounds.fish} onChange={(value) => sounds.setSound("fish", value)} />
        </div>
      </Panel>
    </div>
  );
}

function StatusTile({ icon, title, value, tone }: { icon: ReactNode; title: string; value: string; tone: "cyan" | "amber" }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-[22px] border p-3 shadow-[0_18px_54px_rgba(0,0,0,.22)]", tone === "cyan" ? "border-cyan-100/14 bg-cyan-300/10" : "border-amber-100/16 bg-amber-300/10")}>
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl", tone === "cyan" ? "bg-cyan-300/22" : "bg-amber-300/22")} />
      <div className="relative z-10 grid h-11 w-11 place-items-center rounded-2xl bg-slate-950/36 text-cyan-50">{icon}</div>
      <div className="relative z-10 flex h-full flex-col justify-end">
        <div className="text-lg font-black text-cyan-50">{title}</div>
        <div className="mt-1 text-xs font-bold text-cyan-100/62">{value}</div>
      </div>
    </div>
  );
}

function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button className={cn("flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition active:scale-[.99]", checked ? "border-emerald-200/28 bg-emerald-300/12" : "border-cyan-100/10 bg-slate-950/30")} onClick={() => onChange(!checked)} type="button">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", checked ? "bg-emerald-300 text-slate-950" : "bg-slate-950/45 text-cyan-100/52")}>
          {checked ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-black text-cyan-50">{label}</span>
          <span className="block truncate text-xs text-cyan-100/58">{detail}</span>
        </span>
      </div>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full border transition", checked ? "border-emerald-200/35 bg-emerald-300/30" : "border-cyan-100/15 bg-slate-950/45")}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-cyan-50 transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}