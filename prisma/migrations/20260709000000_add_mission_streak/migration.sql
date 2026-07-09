-- Add weekly mission streak fields to profiles
ALTER TABLE "profiles" ADD COLUMN "missionStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profiles" ADD COLUMN "missionStreakWeek" TIMESTAMP(3);
