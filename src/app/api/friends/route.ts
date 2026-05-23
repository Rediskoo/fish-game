import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { addFriendSchema } from "@/lib/validation/game";
import { FriendsService } from "@/server/services/friends.service";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const friends = await new FriendsService(getPrisma()).listFriends(userId);
    return ok({ friends });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Friends fetch failed", 500);
  }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = addFriendSchema.parse(await request.json());
    const friends = await new FriendsService(getPrisma()).addFriend(userId, body.telegramId);
    return ok({ friends });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Friend add failed");
  }
}
