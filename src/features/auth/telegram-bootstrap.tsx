"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready: () => void;
        expand: () => void;
        requestFullscreen?: () => void;
        enableClosingConfirmation?: () => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred: (type: "success" | "warning" | "error") => void;
        };
      };
    };
  }
}

export function TelegramBootstrap() {
  const queryClient = useQueryClient();
  const auth = useMutation({
    mutationFn: (initData: string) =>
      api<AquariumSnapshot>("/api/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ initData })
      }),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(["snapshot"], snapshot);
    }
  });
  const { mutate, isPending, isSuccess } = auth;

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
    webApp?.requestFullscreen?.();
    webApp?.enableClosingConfirmation?.();

    if (webApp?.initData && !isPending && !isSuccess) {
      mutate(webApp.initData);
    }
  }, [isPending, isSuccess, mutate]);

  return null;
}
