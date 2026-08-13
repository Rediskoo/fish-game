"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { SharedAquariumView } from "@/types/game";
export function useSharedAquariums(enabled = true) { return useQuery({ queryKey: ["shared-aquariums"], queryFn: () => api<SharedAquariumView[]>("/api/shared-aquariums"), enabled, refetchInterval: 15_000 }); }
export function useSharedAquariumAction() { const client = useQueryClient(); return useMutation({ mutationFn: (input: { aquariumId: string; action: "feed" | "clean" | "rename" | "customize"; fishId?: string; name?: string; itemId?: string }) => api<SharedAquariumView[]>("/api/shared-aquariums", { method: "PATCH", body: JSON.stringify(input) }), onSuccess: (data) => { client.setQueryData(["shared-aquariums"], data); void client.invalidateQueries({ queryKey: ["snapshot"] }); } }); }
