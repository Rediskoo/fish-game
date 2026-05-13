"use client";

import { Fish, Send, Trophy } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { usePlayer } from "@/features/auth/use-player";

export function ProfileScreen() {
  const player = usePlayer();
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  const telegramAuthUrl = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : null;
  const needsAuth = player.isError || !player.data;

  return (
    <div className="space-y-4 p-4">
      <header className="pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Profile</p>
        <h1 className="text-3xl font-black text-cyan-50 text-glow">{player.data?.user.firstName ?? "Игрок"}</h1>
      </header>
      <Panel className="grid grid-cols-2 gap-3">
        <Stat icon={<Fish className="h-5 w-5" />} label="Рыбки" value={player.data?.fish.length ?? 0} />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Уровень" value={player.data?.aquarium.level ?? 1} />
      </Panel>
      <Panel>
        <div className="text-sm text-cyan-100/60">Telegram User ID</div>
        <div className="font-mono text-lg">{player.data?.user.telegramId ?? "Mini App auth required"}</div>
        {needsAuth && telegramAuthUrl ? (
          <a
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950"
            href={telegramAuthUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Send className="h-4 w-4" />
            Войти через Telegram
          </a>
        ) : null}
      </Panel>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-950/30 p-3">
      <div className="flex items-center gap-2 text-cyan-100/65">{icon}<span className="text-sm">{label}</span></div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}
