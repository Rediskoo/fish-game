"use client";

import { Bell, Smartphone, Volume2 } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { useSoundStore } from "@/stores/sound-store";

export function SettingsScreen() {
  const sounds = useSoundStore();

  return (
    <div className="space-y-4 p-4">
      <header className="pt-14">
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Настройки</h1>
      </header>
      <Panel className="space-y-3">
        <Row icon={<Smartphone className="h-5 w-5" />} title="Telegram fullscreen" value="enabled" />
        <Row icon={<Bell className="h-5 w-5" />} title="Haptic feedback" value="enabled" />
      </Panel>
      <Panel className="space-y-3">
        <div className="flex items-center gap-2 font-bold">
          <Volume2 className="h-5 w-5 text-cyan-100/70" />
          Звуки
        </div>
        <Toggle label="Все звуки" checked={sounds.all} onChange={(value) => sounds.setSound("all", value)} />
        <Toggle label="Кнопки" checked={sounds.buttons} onChange={(value) => sounds.setSound("buttons", value)} />
        <Toggle label="Рулетка" checked={sounds.roulette} onChange={(value) => sounds.setSound("roulette", value)} />
        <Toggle label="Рыбки" checked={sounds.fish} onChange={(value) => sounds.setSound("fish", value)} />
      </Panel>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-slate-950/30 p-3">
      <span className="text-cyan-50">{label}</span>
      <input className="h-5 w-5 accent-cyan-300" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Row({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-950/30 p-3">
      <div className="flex items-center gap-2 text-cyan-50">{icon}<span>{title}</span></div>
      <span className="text-sm text-cyan-100/55">{value}</span>
    </div>
  );
}
