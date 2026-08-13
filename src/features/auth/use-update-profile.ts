"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { profileName: string; profileBio: string; profileAvatar: string | null }) =>
      api<AquariumSnapshot>("/api/user", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(["snapshot"], snapshot);
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
    }
  });
}
