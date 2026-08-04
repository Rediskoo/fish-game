"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AcquiredFish, AquariumSnapshot, FriendsPayload } from "@/types/game";

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: () => api<FriendsPayload>("/api/friends")
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (telegramId: string) =>
      api<FriendsPayload>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ telegramId })
      }),
    onSuccess: (data) => queryClient.setQueryData(["friends"], data)
  });
}

export function useFriendRequestAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: string; action: "accept" | "decline" }) =>
      api<FriendsPayload>("/api/friends", {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    onSuccess: (data) => queryClient.setQueryData(["friends"], data)
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) =>
      api<FriendsPayload>(`/api/friends?friendId=${friendId}`, {
        method: "DELETE"
      }),
    onSuccess: (data) => queryClient.setQueryData(["friends"], data)
  });
}

export function useSendFriendGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { friendId: string; type: string; fishId?: string }) =>
      api<{ friends: FriendsPayload; snapshot: AquariumSnapshot }>("/api/friends/gift", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: ({ friends, snapshot }) => {
      queryClient.setQueryData(["friends"], friends);
      queryClient.setQueryData(["snapshot"], snapshot);
    }
  });
}

export function useClaimFriendGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (giftId: string) =>
      api<{ friends: FriendsPayload; snapshot: AquariumSnapshot; acquiredFish: AcquiredFish | null }>("/api/friends/gift", {
        method: "PATCH",
        body: JSON.stringify({ giftId })
      }),
    onSuccess: ({ friends, snapshot }) => {
      queryClient.setQueryData(["friends"], friends);
      queryClient.setQueryData(["snapshot"], snapshot);
    }
  });
}

export function useVisitFriendAquarium() {
  return useMutation({
    mutationFn: (friendId: string) =>
      api<{ notified: boolean }>("/api/friends/visit", {
        method: "POST",
        body: JSON.stringify({ friendId })
      })
  });
}
