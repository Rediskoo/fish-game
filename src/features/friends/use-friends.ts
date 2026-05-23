"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { FriendView } from "@/types/game";

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: () => api<{ friends: FriendView[] }>("/api/friends")
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (telegramId: string) =>
      api<{ friends: FriendView[] }>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ telegramId })
      }),
    onSuccess: (data) => queryClient.setQueryData(["friends"], data)
  });
}
