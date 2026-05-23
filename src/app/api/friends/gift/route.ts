import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { friendGiftSchema } from "@/lib/validation/game";
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
