import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { claimFriendGiftSchema, friendGiftSchema } from "@/lib/validation/game";
import { FriendsService } from "@/server/services/friends.service";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = friendGiftSchema.parse(await request.json());
    const friends = await new FriendsService(getPrisma()).sendGift(userId, body.friendId, body.type);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok({ friends, snapshot });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Gift send failed");
  }
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = claimFriendGiftSchema.parse(await request.json());
    const service = new FriendsService(getPrisma());
    const { friends, acquiredFish } = await service.claimGift(userId, body.giftId);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok({ friends, snapshot, acquiredFish });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Gift claim failed");
  }
}
