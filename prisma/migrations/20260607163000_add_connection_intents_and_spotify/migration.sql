-- Add connection modes to profiles and backfill from the existing relationship goal.
ALTER TABLE "profiles"
ADD COLUMN "connectionModes" TEXT[] NOT NULL DEFAULT ARRAY['dating']::TEXT[];

UPDATE "profiles"
SET "connectionModes" = CASE
  WHEN lower(coalesce("lookingFor", '')) = 'friendship' THEN ARRAY['friendship']::TEXT[]
  WHEN lower(coalesce("lookingFor", '')) = 'networking' THEN ARRAY['friendship']::TEXT[]
  ELSE ARRAY['dating']::TEXT[]
END;

-- Keep dating and friendship interactions separate.
ALTER TABLE "interactions"
ADD COLUMN "intent" TEXT NOT NULL DEFAULT 'dating';

DROP INDEX IF EXISTS "interactions_fromUserId_toUserId_key";
CREATE UNIQUE INDEX "interactions_fromUserId_toUserId_intent_key"
ON "interactions"("fromUserId", "toUserId", "intent");

-- Keep dating and friendship matches separate.
ALTER TABLE "matches"
ADD COLUMN "intent" TEXT NOT NULL DEFAULT 'dating';

DROP INDEX IF EXISTS "matches_user1Id_user2Id_key";
CREATE UNIQUE INDEX "matches_user1Id_user2Id_intent_key"
ON "matches"("user1Id", "user2Id", "intent");

-- Spotify snapshots. Tokens are stored encrypted and never returned from public APIs.
CREATE TABLE "spotify_accounts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "spotifyUserId" TEXT NOT NULL,
  "displayName" TEXT,
  "refreshTokenEncrypted" TEXT NOT NULL,
  "topTracks" JSONB NOT NULL DEFAULT '[]',
  "topArtists" JSONB NOT NULL DEFAULT '[]',
  "playlistId" TEXT,
  "playlistUrl" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "spotify_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "spotify_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "spotify_accounts_userId_key" ON "spotify_accounts"("userId");
