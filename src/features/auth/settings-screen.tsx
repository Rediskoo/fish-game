"use client";

import { useState, type ReactNode } from "react";
import { Bell, ChevronDown, ChevronRight, GraduationCap, Globe2, Info, Lock, MessageCircle, Moon, MousePointerClick, Smartphone, Volume2 } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { aquariumAssets } from "@/assets/aquarium-assets";
import { cn } from "@/lib/cn";
import { useSoundStore } from "@/stores/sound-store";
import { useLanguageStore } from "@/stores/language-store";
import { themeOptions, usePreferencesStore } from "@/stores/preferences-store";
import { usePlayer } from "@/features/auth/use-player";

export function SettingsScreen() {
  const sounds = useSoundStore();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const preferences = usePreferencesStore();
  const player = usePlayer();
  const [themesOpen, setThemesOpen] = useState(false);
  const owned = new Set(player.data?.inventory.ownedItemIds ?? []);

  return (
    <div className="space-y-4 p-4">
      <header className="pt-20">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Настройки</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatusTile icon={<Smartphone className="h-5 w-5" />} title="Telegram fullscreen" value="Включен" />
        <button type="button" onClick={() => preferences.toggleHaptics()}><StatusTile icon={<Bell className="h-5 w-5" />} title="Отклики и вибрация" value={preferences.haptics ? "Включены" : "Выключены"} /></button>
      </div>

      <Panel className="space-y-3 overflow-hidden rounded-[18px] border-cyan-100/18 bg-[linear-gradient(145deg,rgba(8,45,62,.78),rgba(5,20,34,.88))]">
        <div>
          <div className="text-lg font-black text-cyan-50">Звуки</div>
          <div className="text-xs text-cyan-100/58">Локально сохраняются на устройстве</div>
        </div>
        <div className="grid gap-2">
          <Toggle icon={<Volume2 className="h-4 w-4" />} label="Все звуки" detail="Главный выключатель" checked={sounds.all} onChange={(value) => sounds.setSound("all", value)} />
          <Toggle icon={<MousePointerClick className="h-4 w-4" />} label="Кнопки" detail="Клики и подтверждения" checked={sounds.buttons} onChange={(value) => sounds.setSound("buttons", value)} />
          <Toggle image={aquariumAssets.icons.ui.currencyCoin} label="Кейсы" detail="Открытие кейса и награда" checked={sounds.roulette} onChange={(value) => sounds.setSound("roulette", value)} />
          <Toggle image={aquariumAssets.icons.ui.fishCases} label="Рыбки" detail="Тапы и реакции рыб" checked={sounds.fish} onChange={(value) => sounds.setSound("fish", value)} />
        </div>
      </Panel>

      <Panel className="space-y-1 overflow-hidden rounded-[18px] border-cyan-100/16 bg-[linear-gradient(145deg,rgba(8,43,59,.72),rgba(4,18,31,.86))]">
        <SettingsRow icon={<GraduationCap className="h-4 w-4" />} label="Повторить обучение" value="" onClick={() => window.dispatchEvent(new Event("aquarium:restart-onboarding"))} />
        <div className="flex min-h-14 items-center gap-3 rounded-xl px-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950/36 text-cyan-100"><Globe2 className="h-4 w-4" /></span><span className="mr-auto text-sm font-bold text-cyan-50">Язык</span><div className="flex rounded-xl bg-slate-950/38 p-1">{([['ru','RU'],['en','EN'],['funny','🤣']] as const).map(([id,label]) => <button key={id} type="button" className={cn("rounded-lg px-2.5 py-1.5 text-xs font-black", language === id ? "bg-cyan-300 text-slate-950" : "text-cyan-100/60")} onClick={() => { setLanguage(id); window.setTimeout(() => window.location.reload(), 0); }}>{label}</button>)}</div></div>
        <div className="rounded-2xl bg-slate-950/22 p-3"><button type="button" className="flex w-full items-center gap-3" onClick={() => setThemesOpen((value) => !value)}><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950/36 text-cyan-100"><Moon className="h-4 w-4" /></span><span className="text-sm font-bold">Тема оформления</span><span className="ml-auto text-xs text-cyan-100/55">{themeOptions.find((item) => item.id === preferences.theme)?.label}</span><ChevronDown className={cn("h-4 w-4 transition", themesOpen && "rotate-180")} /></button>{themesOpen ? <div className="mt-3 grid grid-cols-2 gap-2">{themeOptions.map((option) => { const unlocked = option.id === "ocean" || owned.has(`theme-${option.id}`); return <button key={option.id} type="button" disabled={!unlocked} onClick={() => preferences.setTheme(option.id)} className={cn("flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-black", preferences.theme === option.id ? "border-cyan-200/50 bg-cyan-300/14" : "border-cyan-100/10 bg-slate-950/28", !unlocked && "opacity-45")}><span className="flex">{option.colors.map((color) => <i key={color} className="-mr-1 h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />)}</span><span className="min-w-0 truncate">{option.label}</span>{!unlocked ? <Lock className="ml-auto h-3 w-3" /> : null}</button>; })}</div> : null}</div>
        <SettingsRow icon={<Info className="h-4 w-4" />} label="О приложении" value="Версия 1.0.0" onClick={() => window.alert("Карманный аквариум · версия 1.0.0")} />
        <SettingsRow icon={<MessageCircle className="h-4 w-4" />} label="Поддержка" value="" onClick={() => window.open(process.env.NEXT_PUBLIC_SUPPORT_URL ?? "mailto:support@pocket-aquarium.app", "_blank", "noopener,noreferrer")} />
      </Panel>
    </div>
  );
}

function StatusTile({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="relative min-h-24 overflow-hidden rounded-[18px] border border-cyan-100/16 bg-[linear-gradient(145deg,rgba(10,54,74,.78),rgba(4,21,34,.86))] p-3 shadow-[0_18px_54px_rgba(0,0,0,.22)]">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-300/16 blur-2xl" />
      <div className="relative z-10 flex min-w-0 gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300/14 text-cyan-100">{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-black leading-5 text-cyan-50">{title}</span>
          <span className="mt-1 block truncate text-xs font-bold text-emerald-200">{value}</span>
        </span>
      </div>
    </div>
  );
}

function Toggle({
  icon,
  image,
  label,
  detail,
  checked,
  onChange
}: {
  icon?: ReactNode;
  image?: string;
  label: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button className={cn("flex min-h-16 items-center justify-between gap-3 rounded-2xl border p-3 text-left transition active:scale-[.99]", checked ? "border-emerald-200/28 bg-emerald-300/12" : "border-cyan-100/10 bg-slate-950/30")} onClick={() => onChange(!checked)} type="button">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", checked ? "bg-cyan-300/18 text-cyan-50" : "bg-slate-950/45 text-cyan-100/52")}>
          {image ? <img className="h-5 w-5 object-contain" src={image} alt="" /> : icon}
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

function SettingsRow({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: string; onClick?: () => void }) {
  return (
    <button className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-2.5 text-left transition active:bg-cyan-300/8" type="button" onClick={onClick}>
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950/36 text-cyan-100">{icon}</span>
        <span className="truncate text-sm font-bold text-cyan-50">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-cyan-100/58">
        {value ? <span>{value}</span> : null}
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}
