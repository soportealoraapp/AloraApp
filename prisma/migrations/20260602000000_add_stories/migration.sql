-- CreateTable: Stories
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: StoryViews
CREATE TABLE "story_views" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stories_userId_idx" ON "stories"("userId");
CREATE INDEX "stories_expiresAt_idx" ON "stories"("expiresAt");
CREATE UNIQUE INDEX "story_views_storyId_userId_key" ON "story_views"("storyId", "userId");
CREATE INDEX "story_views_storyId_idx" ON "story_views"("storyId");
CREATE INDEX "story_views_userId_idx" ON "story_views"("userId");
