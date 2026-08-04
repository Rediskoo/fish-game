import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { visitFriendSchema } from "@/lib/validation/game";
import { FriendsService } from "@/server/services/friends.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try {
    const { friendId } = visitFriendSchema.parse(await request.json());
    await new FriendsService(getPrisma()).recordAquariumVisit(userId, friendId);
    return ok({ notified: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Visit notification failed");
  }
}
