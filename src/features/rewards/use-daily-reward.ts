"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

export function useDailyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<{ reward: { amount: number }; snapshot: AquariumSnapshot }>("/api/daily-rewards/claim", {
        method: "POST"
      }),
    onSuccess: ({ snapshot }) => queryClient.setQueryData(["snapshot"], snapshot)
  });
}
