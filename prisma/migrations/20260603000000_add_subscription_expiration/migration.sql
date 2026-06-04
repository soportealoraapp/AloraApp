-- Add subscription expiration fields
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMPTZ;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMPTZ;
