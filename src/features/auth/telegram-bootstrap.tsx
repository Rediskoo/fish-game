"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

/**
 * Debug
 * false = debug-окно скрыто
 * true = debug-окно снова видно
 */
const DEBUG_TELEGRAM_AUTH = false;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            username?: string;
          };
        };
        ready?: () => void;
        expand?: () => void;
        requestFullscreen?: () => void;
        enableClosingConfirmation?: () => void;
      };
    };
  }
}

export function TelegramBootstrap() {
  const queryClient = useQueryClient();
  const [debug, setDebug] = useState("Telegram debug loading...");
  const startedRef = useRef(false);

  const auth = useMutation({
    mutationFn: (initData: string) =>
      api<AquariumSnapshot>("/api/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ initData })
      }),
    onSuccess: async (snapshot) => {
      setDebug("Telegram auth success");

      queryClient.setQueryData(["snapshot"], snapshot);

      await queryClient.invalidateQueries({
        queryKey: ["snapshot"]
      });
    },
    onError: (error) => {
      setDebug(
        "Telegram auth error:\n" +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  useEffect(() => {
    let attempts = 0;

    const tryAuth = () => {
      attempts += 1;

      const webApp = window.Telegram?.WebApp;

      for (const action of [
        () => webApp?.ready?.(),
        () => webApp?.expand?.(),
        () => webApp?.requestFullscreen?.(),
        () => webApp?.enableClosingConfirmation?.()
      ]) {
        try {
          action();
        } catch {
          // Telegram WebApp methods are version-gated; unsupported calls should not block auth.
        }
      }

      const info = {
        attempt: attempts,
        hasTelegram: Boolean(window.Telegram),
        hasWebApp: Boolean(webApp),
        initDataLength: webApp?.initData?.length ?? 0,
        user: webApp?.initDataUnsafe?.user ?? null
      };

      setDebug(JSON.stringify(info, null, 2));

      if (webApp?.initData && !startedRef.current) {
        startedRef.current = true;
        auth.mutate(webApp.initData);
      }
    };

    tryAuth();

    const interval = window.setInterval(() => {
      if (startedRef.current) {
        window.clearInterval(interval);
        return;
      }

      if (attempts >= 30) {
        window.clearInterval(interval);
        return;
      }

      tryAuth();
    }, 300);

    return () => {
      window.clearInterval(interval);
    };
  }, []);
  
  if (!DEBUG_TELEGRAM_AUTH) {
    return null;
  }

  return (
    <pre className="fixed left-2 top-20 z-[9999] max-w-[95vw] whitespace-pre-wrap rounded bg-black/80 p-2 text-xs text-white">
      {debug}
    </pre>
  );
}
