import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { renameFishSchema } from "@/lib/validation/game";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const fishId = url.searchParams.get("fishId");
    if (!fishId) return fail("fishId is required");

    const body = renameFishSchema.parse(await request.json());
    const existing = await getPrisma().fish.findFirst({ where: { id: fishId, ownerId: userId } });
    if (!existing) return fail("Fish not found", 404);
    const fish = await getPrisma().fish.update({ where: { id: fishId }, data: { name: body.name }, include: { fishType: true } });
    return ok(fish);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Fish update failed");
  }
}
