import type { PrismaClient } from "@prisma/client";

let schemaPromise: Promise<void> | null = null;

/** Keeps rolling deploys compatible when the managed database is reachable
 * from Vercel Runtime but intentionally unavailable to the build machine. */
export function ensureLatestSchema(db: PrismaClient) {
  schemaPromise ??= (async () => {
    await db.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileName" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileBio" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileAvatar" TEXT`);
    await db.$executeRawUnsafe(`ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'MATCH_THREE_REWARD'`);
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "shared_aquariums" ("id" TEXT PRIMARY KEY, "pairKey" TEXT NOT NULL UNIQUE, "memberAId" TEXT NOT NULL, "memberBId" TEXT NOT NULL, "name" TEXT NOT NULL DEFAULT 'Общий аквариум', "pollution" INTEGER NOT NULL DEFAULT 0, "lastPollutionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`);
    await db.$executeRawUnsafe(`ALTER TABLE "fish" ADD COLUMN IF NOT EXISTS "sharedAquariumId" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "breeding_jobs" ADD COLUMN IF NOT EXISTS "collaboratorId" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "breeding_jobs" ADD COLUMN IF NOT EXISTS "collaborationAcceptedAt" TIMESTAMP(3)`);
    await db.$executeRawUnsafe(`ALTER TABLE "breeding_jobs" ADD COLUMN IF NOT EXISTS "sharedAquariumId" TEXT`);
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}
