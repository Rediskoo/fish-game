"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { BreedingPayload } from "@/features/breeding/types";

export function useBreeding() {
  return useQuery({ queryKey: ["breeding"], queryFn: () => api<BreedingPayload>("/api/breeding"), refetchInterval: 15_000 });
}

export function useStartBreeding() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: { parentAId: string; parentBId: string; idempotencyKey: string }) => api<BreedingPayload>("/api/breeding", { method: "POST", body: JSON.stringify(input) }), onSuccess: (data) => queryClient.setQueryData(["breeding"], data) });
}

export function useBreedingAction() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: { jobId: string; action: "incubate" | "speed-up" | "condition" | "claim" | "invite" | "accept"; friendId?: string }) => api<BreedingPayload>("/api/breeding", { method: "PATCH", body: JSON.stringify(input) }), onSuccess: (data) => { queryClient.setQueryData(["breeding"], data); void queryClient.invalidateQueries({ queryKey: ["snapshot"] }); void queryClient.invalidateQueries({ queryKey: ["friends"] }); void queryClient.invalidateQueries({ queryKey: ["shared-aquariums"] }); } });
}
