-- AlterTable: Add daily likes tracking and boost fields to profiles
ALTER TABLE "profiles" ADD COLUMN "dailyLikesUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profiles" ADD COLUMN "dailyLikesResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "profiles" ADD COLUMN "boostExpiresAt" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN "lastBoostAt" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN "totalBoosts" INTEGER NOT NULL DEFAULT 0;
