-- CreateTable: MatchFeedback
CREATE TABLE "match_feedback" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "match_feedback_matchId_userId_key" ON "match_feedback"("matchId", "userId");
CREATE INDEX "match_feedback_matchId_idx" ON "match_feedback"("matchId");
