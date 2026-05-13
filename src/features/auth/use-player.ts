"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

export function usePlayer() {
  return useQuery({
    queryKey: ["snapshot"],
    queryFn: () => api<AquariumSnapshot>("/api/user")
  });
}
