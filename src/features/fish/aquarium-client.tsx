"use client";

import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { usePlayer } from "@/features/auth/use-player";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AquariumClient() {
  const queryClient = useQueryClient();
  const player = usePlayer();
  const devLogin = useMutation({
    mutationFn: () => api<AquariumSnapshot>("/api/auth/dev", { method: "POST" }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
  const fish = player.data?.fish ?? [];
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  const telegramAuthUrl = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : null;

  return (
    <div className="absolute inset-0">
      <AquariumRenderer fish={fish} />
      {player.isError ? (
        <div className="absolute inset-x-4 top-24 rounded-2xl border border-cyan-200/15 bg-slate-950/70 p-4 text-sm text-cyan-50">
          <p>Открой Mini App из Telegram или войди через корректный initData.</p>
          {telegramAuthUrl ? (
            <a
              className="mt-3 inline-flex rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950"
              href={telegramAuthUrl}
              rel="noreferrer"
              target="_blank"
            >
              Войти через Telegram
            </a>
          ) : null}
          {process.env.NODE_ENV !== "production" ? (
            <button
              className="mt-3 rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950"
              disabled={devLogin.isPending}
              onClick={() => devLogin.mutate()}
            >
              Локальный dev-вход
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
