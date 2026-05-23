"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

export function useRenameFish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { fishId: string; name: string }) =>
      api<AquariumSnapshot>(`/api/fish?fishId=${input.fishId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: input.name })
      }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
}

export function useSellFish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fishId: string) =>
      api<AquariumSnapshot>(`/api/fish?fishId=${fishId}`, {
        method: "DELETE"
      }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
}
