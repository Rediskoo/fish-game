CREATE TABLE IF NOT EXISTS "memory_games" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "cards" JSONB NOT NULL,
  "matchedIndices" JSONB NOT NULL DEFAULT '[]',
  "firstCard" INTEGER,
  "moves" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "reward" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "memory_games_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "memory_games_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "memory_games_ownerId_status_idx" ON "memory_games"("ownerId", "status");
