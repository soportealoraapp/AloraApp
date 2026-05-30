-- AlterTable: Add location fields to profiles
ALTER TABLE "profiles" ADD COLUMN "cityId" TEXT,
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "stateCode" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "lookingFor" TEXT;

-- CreateTable: ProfileVisit
CREATE TABLE "profile_visits" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_visits_visitorId_createdAt_idx" ON "profile_visits"("visitorId", "createdAt");
CREATE INDEX "profile_visits_visitedId_createdAt_idx" ON "profile_visits"("visitedId", "createdAt");

-- AddForeignKey
ALTER TABLE "profile_visits" ADD CONSTRAINT "profile_visits_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
