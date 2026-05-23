import { z } from "zod";
import { GiftType } from "@prisma/client";

export const telegramAuthSchema = z.object({
  initData: z.string().min(10)
});

export const renameFishSchema = z.object({
  name: z.string().trim().min(2).max(18)
});

export const feedFishSchema = z.object({
  fishId: z.string().cuid()
});

export const addFriendSchema = z.object({
  telegramId: z.string().trim().regex(/^\d{5,20}$/, "Invalid Telegram User ID")
});

export const friendRequestActionSchema = z.object({
  requestId: z.string().cuid(),
  action: z.enum(["accept", "decline"])
});

export const friendGiftSchema = z.object({
  friendId: z.string().cuid(),
  type: z.enum(GiftType)
});
