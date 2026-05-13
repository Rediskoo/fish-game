"use client";

import { Bell, Smartphone } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export function SettingsScreen() {
  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Settings</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">Настройки</h1>
      </header>
      <Panel className="space-y-3">
        <Row icon={<Smartphone className="h-5 w-5" />} title="Telegram fullscreen" value="enabled" />
        <Row icon={<Bell className="h-5 w-5" />} title="Haptic feedback" value="enabled" />
      </Panel>
    </div>
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
