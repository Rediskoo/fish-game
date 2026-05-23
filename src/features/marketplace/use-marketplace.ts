"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AcquiredFish, AquariumSnapshot, MarketplaceFish } from "@/types/game";

export function useMarketplace() {
  return useQuery({
    queryKey: ["marketplace"],
    queryFn: () => api<{ fishTypes: MarketplaceFish[]; fishCost: number; foodCost: number }>("/api/marketplace")
  });
}

export function usePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { item: "fish" | "food"; amount?: number }) =>
      api<{ snapshot: AquariumSnapshot; acquiredFish: AcquiredFish | null }>("/api/marketplace/purchase", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: ({ snapshot }) => queryClient.setQueryData(["snapshot"], snapshot)
  });
}
