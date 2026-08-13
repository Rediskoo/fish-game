import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { BreedingService } from "@/server/services/breeding.service";
import { breedingActionSchema, startBreedingSchema } from "@/lib/validation/game";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try { return ok(await new BreedingService(getPrisma()).getState(userId)); }
  catch (error) { return fail(error instanceof Error ? error.message : "Breeding fetch failed"); }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try {
    const input = startBreedingSchema.parse(await request.json());
    await new BreedingService(getPrisma()).start(userId, input);
    return ok(await new BreedingService(getPrisma()).getState(userId));
  } catch (error) { return fail(error instanceof Error ? error.message : "Breeding start failed"); }
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try {
    const input = breedingActionSchema.parse(await request.json());
    const service = new BreedingService(getPrisma());
    if (input.action === "incubate") await service.incubate(userId, input.jobId);
    else if (input.action === "speed-up") await service.speedUp(userId, input.jobId);
    else await service.claim(userId, input.jobId);
    return ok(await service.getState(userId));
  } catch (error) { return fail(error instanceof Error ? error.message : "Breeding action failed"); }
}
