import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { addFriendSchema, friendRequestActionSchema } from "@/lib/validation/game";
import { FriendsService } from "@/server/services/friends.service";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const payload = await new FriendsService(getPrisma()).getFriendsPayload(userId);
    return ok(payload);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Friends fetch failed", 500);
  }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = addFriendSchema.parse(await request.json());
    const payload = await new FriendsService(getPrisma()).createFriendRequest(userId, body.query);
    return ok(payload);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Friend add failed");
  }
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = friendRequestActionSchema.parse(await request.json());
    const service = new FriendsService(getPrisma());
    const payload =
      body.action === "accept"
        ? await service.acceptFriendRequest(userId, body.requestId)
        : await service.declineFriendRequest(userId, body.requestId);
    return ok(payload);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Friend request update failed");
  }
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const friendId = url.searchParams.get("friendId");
    if (!friendId) return fail("friendId is required");
    const payload = await new FriendsService(getPrisma()).removeFriend(userId, friendId);
    return ok(payload);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Friend remove failed");
  }
}
