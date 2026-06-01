-- CreateTable: DailyPicks
CREATE TABLE "daily_picks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "liked" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_picks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_picks_userId_profileId_date_key" ON "daily_picks"("userId", "profileId", "date");
CREATE INDEX "daily_picks_userId_date_idx" ON "daily_picks"("userId", "date");
