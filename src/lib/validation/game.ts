import { z } from "zod";

export const telegramAuthSchema = z.object({
  initData: z.string().min(10)
});

export const renameFishSchema = z.object({
  name: z.string().trim().min(2).max(18)
});

export const feedFishSchema = z.object({
  fishId: z.string().cuid()
});
