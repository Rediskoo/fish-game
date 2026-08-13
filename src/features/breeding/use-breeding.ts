"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { BreedingPayload } from "@/features/breeding/types";

export function useBreeding() {
  return useQuery({ queryKey: ["breeding"], queryFn: () => api<BreedingPayload>("/api/breeding"), refetchInterval: 60_000 });
}

export function useStartBreeding() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: { parentAId: string; parentBId: string; idempotencyKey: string }) => api<BreedingPayload>("/api/breeding", { method: "POST", body: JSON.stringify(input) }), onSuccess: (data) => queryClient.setQueryData(["breeding"], data) });
}

export function useBreedingAction() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: { jobId: string; action: "speed-up" | "claim" }) => api<BreedingPayload>("/api/breeding", { method: "PATCH", body: JSON.stringify(input) }), onSuccess: (data, input) => { queryClient.setQueryData(["breeding"], data); if (input.action === "claim") queryClient.invalidateQueries({ queryKey: ["snapshot"] }); } });
}
