-- AlterTable: Add match health fields

ALTER TABLE "matches" ADD COLUMN "healthScore" INTEGER DEFAULT 0;
ALTER TABLE "matches" ADD COLUMN "healthUpdatedAt" TIMESTAMP;
