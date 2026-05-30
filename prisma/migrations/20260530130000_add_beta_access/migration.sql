-- AlterTable: Add beta fields to users
ALTER TABLE "users" ADD COLUMN "isBetaUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "betaInvitedBy" TEXT;

-- CreateTable: BetaCode
CREATE TABLE "beta_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beta_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beta_codes_code_key" ON "beta_codes"("code");
CREATE INDEX "beta_codes_code_idx" ON "beta_codes"("code");
CREATE INDEX "beta_codes_active_idx" ON "beta_codes"("active");
