-- AlterTable: Add reactions, badges, mute, hiddenBy

-- Messages: add reactions JSONB column
ALTER TABLE "messages" ADD COLUMN "reactions" JSONB DEFAULT '{}';

-- Profiles: add badges JSONB column
ALTER TABLE "profiles" ADD COLUMN "badges" JSONB DEFAULT '[]';

-- Matches: add mutedUntil timestamp
ALTER TABLE "matches" ADD COLUMN "mutedUntil" TIMESTAMP;

-- Matches: add hiddenBy text array
ALTER TABLE "matches" ADD COLUMN "hiddenBy" TEXT[] DEFAULT '{}';
