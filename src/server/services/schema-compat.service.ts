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
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "memory_games" ("id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "cards" JSONB NOT NULL, "matchedIndices" JSONB NOT NULL DEFAULT '[]', "firstCard" INTEGER, "moves" INTEGER NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3), "reward" INTEGER NOT NULL DEFAULT 0)`);
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "breeding_invitations" ("id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "friendId" TEXT NOT NULL, "parentFishId" TEXT, "parentSnapshot" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "idempotencyKey" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "breeding_invitations_ownerId_idempotencyKey_key" ON "breeding_invitations"("ownerId", "idempotencyKey")`);
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}
