-- AlterTable: Add voice intro fields

ALTER TABLE "profiles" ADD COLUMN "voiceIntro" TEXT;
ALTER TABLE "profiles" ADD COLUMN "voiceIntroDuration" INTEGER;
