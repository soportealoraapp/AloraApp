-- CreateTable: SuccessStories
CREATE TABLE "success_stories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "photoUrl" TEXT,
    "authorId" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "success_stories_approved_idx" ON "success_stories"("approved");
