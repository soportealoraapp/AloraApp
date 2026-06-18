-- AlterTable: Add mutedByUserId column to Match
ALTER TABLE "Match" ADD COLUMN "mutedByUserId" TEXT;

-- Backfill: existing muted rows have no known muter, clear them to avoid ambiguity
UPDATE "Match" SET "mutedUntil" = NULL, "mutedByUserId" = NULL WHERE "mutedUntil" IS NOT NULL;
