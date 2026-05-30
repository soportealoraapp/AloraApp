-- AlterTable: Add profile fields
ALTER TABLE "profiles" ADD COLUMN "city" TEXT,
ADD COLUMN "zodiacSign" TEXT,
ADD COLUMN "education" TEXT,
ADD COLUMN "smoking" TEXT,
ADD COLUMN "drinking" TEXT,
ADD COLUMN "children" TEXT,
ADD COLUMN "religion" TEXT,
ADD COLUMN "musicGenres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "status" TEXT,
ADD COLUMN "personalGuide" JSONB,
ADD COLUMN "incognitoMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showMeInDiscover" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: QuizResult
CREATE TABLE "quiz_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER,
    "archetype" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on userId + quizId
CREATE UNIQUE INDEX "quiz_results_userId_quizId_key" ON "quiz_results"("userId", "quizId");

-- AddForeignKey: quiz_results -> users
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
