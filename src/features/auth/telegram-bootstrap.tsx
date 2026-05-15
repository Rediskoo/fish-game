"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

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
  const [debug, setDebug] = useState("debug loading...");

  const auth = useMutation({
    mutationFn: (initData: string) =>
      api<AquariumSnapshot>("/api/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ initData })
      }),
    onSuccess: (snapshot) => {
      setDebug("Telegram auth success");
      queryClient.setQueryData(["snapshot"], snapshot);
    },
    onError: (error) => {
      setDebug(
        "Telegram auth error:\n" +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  const { mutate, isPending, isSuccess } = auth;

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    webApp?.ready?.();
    webApp?.expand?.();
    webApp?.requestFullscreen?.();
    webApp?.enableClosingConfirmation?.();

    const info = {
      hasTelegram: Boolean(window.Telegram),
      hasWebApp: Boolean(webApp),
      initDataLength: webApp?.initData?.length ?? 0,
      user: webApp?.initDataUnsafe?.user ?? null
    };

    setDebug(JSON.stringify(info, null, 2));

    if (webApp?.initData && !isPending && !isSuccess) {
      mutate(webApp.initData);
    }
  }, [isPending, isSuccess, mutate]);

  return (
    <pre className="fixed left-2 top-20 z-[9999] max-w-[95vw] whitespace-pre-wrap rounded bg-black/80 p-2 text-xs text-white">
      {debug}
    </pre>
  );
}
