-- Add expiresAt to daily_answers so answers disappear from profiles after 24h
ALTER TABLE "daily_answers" ADD COLUMN "expiresAt" TIMESTAMP(3);
UPDATE "daily_answers" SET "expiresAt" = "createdAt" + interval '24 hours' WHERE "expiresAt" IS NULL;

-- Create prompt_templates (predefined profile prompts, Tinder/Facebook Dating style)
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "prompt_templates_text_key" ON "prompt_templates"("text");
CREATE INDEX "prompt_templates_category_idx" ON "prompt_templates"("category");

-- Create user_prompts (user answers to predefined prompts, shown on profile)
CREATE TABLE "user_prompts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_prompts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_prompts_userId_promptId_key" ON "user_prompts"("userId", "promptId");
CREATE INDEX "user_prompts_userId_idx" ON "user_prompts"("userId");
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompt_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
