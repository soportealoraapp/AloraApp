-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "data" JSONB;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "incomplete_media" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isShadowBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reputationScore" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_fingerprints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "os" TEXT,
    "browser" TEXT,
    "timezone" TEXT,
    "language" TEXT,
    "screenSize" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "workerId" TEXT,
    "result" JSONB,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "communicationPrefs" TEXT,
    "emotionalPatterns" TEXT,
    "conversationTendencies" TEXT,
    "pacingStyle" TEXT,
    "relationshipIntentions" TEXT,
    "loveLanguage" TEXT,
    "conflictStyle" TEXT,
    "opennessLevel" TEXT,
    "toleratedIntensity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_snapshots" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "emotionalDepth" DOUBLE PRECISION NOT NULL,
    "reciprocity" DOUBLE PRECISION NOT NULL,
    "consistency" DOUBLE PRECISION NOT NULL,
    "responseBalance" DOUBLE PRECISION NOT NULL,
    "conflictRisk" DOUBLE PRECISION NOT NULL,
    "attachmentTrend" DOUBLE PRECISION NOT NULL,
    "chemistryScore" DOUBLE PRECISION NOT NULL,
    "vulnerabilityScore" DOUBLE PRECISION NOT NULL,
    "engagementLevel" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationship_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_reflections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "matchId" TEXT,
    "emotionalSafety" INTEGER NOT NULL,
    "chemistry" INTEGER NOT NULL,
    "authenticity" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "wouldSeeAgain" BOOLEAN NOT NULL,
    "notes" TEXT,
    "aiAnalysis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "autoResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idempotency_keys_userId_idx" ON "idempotency_keys"("userId");

-- CreateIndex
CREATE INDEX "idempotency_keys_createdAt_idx" ON "idempotency_keys"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_action_key" ON "idempotency_keys"("key", "action");

-- CreateIndex
CREATE INDEX "push_tokens_userId_idx" ON "push_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_event_idx" ON "analytics_events"("event");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE INDEX "device_fingerprints_userId_idx" ON "device_fingerprints"("userId");

-- CreateIndex
CREATE INDEX "device_fingerprints_deviceHash_idx" ON "device_fingerprints"("deviceHash");

-- CreateIndex
CREATE INDEX "verification_submissions_userId_idx" ON "verification_submissions"("userId");

-- CreateIndex
CREATE INDEX "verification_submissions_status_idx" ON "verification_submissions"("status");

-- CreateIndex
CREATE INDEX "jobs_status_priority_scheduledAt_idx" ON "jobs"("status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "locks_name_key" ON "locks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_memory_userId_key" ON "user_memory"("userId");

-- CreateIndex
CREATE INDEX "relationship_snapshots_matchId_generatedAt_idx" ON "relationship_snapshots"("matchId", "generatedAt");

-- CreateIndex
CREATE INDEX "date_reflections_userId_idx" ON "date_reflections"("userId");

-- CreateIndex
CREATE INDEX "incidents_type_createdAt_idx" ON "incidents"("type", "createdAt");

-- CreateIndex
CREATE INDEX "reports_reportedId_idx" ON "reports"("reportedId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_submissions" ADD CONSTRAINT "verification_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memory" ADD CONSTRAINT "user_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_snapshots" ADD CONSTRAINT "relationship_snapshots_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_reflections" ADD CONSTRAINT "date_reflections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
