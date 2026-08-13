import { z } from "zod";
import { GiftType } from "@prisma/client";

export const telegramAuthSchema = z.object({
  initData: z.string().min(10)
});

export const renameFishSchema = z.object({
  name: z.string().trim().min(2).max(18).optional(),
  isFavorite: z.boolean().optional()
}).refine((value) => value.name !== undefined || value.isFavorite !== undefined, {
  message: "Nothing to update"
});

export const feedFishSchema = z.object({
  fishId: z.string().cuid().optional(),
  foodType: z.enum(["basic", "large", "aquarium"]).default("basic"),
  quantity: z.number().int().min(1).max(10).default(1)
}).refine((value) => value.foodType === "aquarium" || Boolean(value.fishId), { message: "Choose a fish" });

export const addFriendSchema = z.object({
  query: z.string().trim().min(3).max(32).refine((value) => /^\d{5,20}$/.test(value) || /^@?[A-Za-z0-9_]{3,32}$/.test(value), "Введите Telegram ID или @username")
});

export const friendRequestActionSchema = z.object({
  requestId: z.string().cuid(),
  action: z.enum(["accept", "decline"])
});

export const friendGiftSchema = z.object({
  friendId: z.string().cuid(),
  type: z.enum(GiftType),
  fishId: z.string().cuid().optional()
});

export const claimFriendGiftSchema = z.object({
  giftId: z.string().cuid()
});

export const visitFriendSchema = z.object({
  friendId: z.string().cuid()
});

export const startBreedingSchema = z.object({
  parentAId: z.string().cuid(),
  parentBId: z.string().cuid(),
  idempotencyKey: z.string().uuid()
}).refine((value) => value.parentAId !== value.parentBId, { message: "Choose two different fish" });

export const breedingActionSchema = z.object({
  jobId: z.string().cuid(),
  action: z.enum(["incubate", "speed-up", "condition", "claim", "invite", "accept"]),
  friendId: z.string().cuid().optional()
}).refine((value) => value.action !== "invite" || Boolean(value.friendId), { message: "Choose a friend" });
