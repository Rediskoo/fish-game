CREATE TABLE IF NOT EXISTS "breeding_invitations" (
  "id" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "friendId" TEXT NOT NULL, "parentFishId" TEXT,
  "parentSnapshot" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "idempotencyKey" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "breeding_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "breeding_invitations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "breeding_invitations_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "breeding_invitations_parentFishId_fkey" FOREIGN KEY ("parentFishId") REFERENCES "fish"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "breeding_invitations_ownerId_idempotencyKey_key" ON "breeding_invitations"("ownerId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "breeding_invitations_friendId_status_idx" ON "breeding_invitations"("friendId", "status");
CREATE INDEX IF NOT EXISTS "breeding_invitations_parentFishId_idx" ON "breeding_invitations"("parentFishId");
