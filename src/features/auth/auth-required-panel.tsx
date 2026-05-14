"use client";

import { Send } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export function AuthRequiredPanel() {
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  const miniAppShortName = process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_SHORT_NAME?.replace(/^\//, "").trim();
  const telegramMiniAppUrl = process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_URL?.trim();
  const telegramAuthUrl =
    telegramMiniAppUrl ??
    (telegramBotUsername && miniAppShortName ? `https://t.me/${telegramBotUsername}/${miniAppShortName}` : null);

  return (
    <div className="flex min-h-[calc(100dvh-96px-var(--safe-top)-var(--safe-bottom))] items-center p-4">
      <Panel className="w-full space-y-4 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/55">Telegram auth</p>
          <h1 className="mt-2 text-2xl font-black text-cyan-50 text-glow">Войди через Telegram</h1>
        </div>
        <p className="text-sm text-cyan-100/70">
          Каждый Telegram аккаунт получает свой аквариум, валюту, корм, награды и рыбок.
        </p>
        {telegramAuthUrl ? (
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950"
            href={telegramAuthUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Send className="h-4 w-4" />
            Открыть Mini App
          </a>
        ) : (
          <p className="rounded-xl border border-yellow-200/20 bg-yellow-200/10 p-3 text-sm text-yellow-100">
            Не задана ссылка на Telegram Mini App.
          </p>
        )}
      </Panel>
    </div>
  );
}
