-- CreateTable: Favorites
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorites_userId_profileId_key" ON "favorites"("userId", "profileId");
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");
CREATE INDEX "favorites_profileId_idx" ON "favorites"("profileId");
