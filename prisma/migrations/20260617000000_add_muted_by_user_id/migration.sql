-- AlterTable: Add mutedByUserId column to matches
ALTER TABLE "matches" ADD COLUMN "mutedByUserId" TEXT;

-- Backfill: existing muted rows have no known muter, clear them to avoid ambiguity
UPDATE "matches" SET "mutedUntil" = NULL, "mutedByUserId" = NULL WHERE "mutedUntil" IS NOT NULL;
