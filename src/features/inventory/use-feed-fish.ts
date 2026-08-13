"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

export function useFeedFish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { fishId?: string; foodType: "basic" | "large" | "aquarium"; quantity: number }) =>
      api<AquariumSnapshot>("/api/inventory/feed", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
}
