import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job: Cleanup stale sessions, expired data, and orphaned records.
 * Run daily via Vercel Cron or external scheduler.
 *
 * { "crons": [{ "path": "/api/cron/cleanup-sessions", "schedule": "0 3 * * *" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results: Record<string, number> = {};

        // 1. Expired sessions (>30 days)
        const sessionCutoff = new Date();
        sessionCutoff.setDate(sessionCutoff.getDate() - 30);
        const { count: sessionsDeleted } = await prisma.session.deleteMany({
            where: { expiresAt: { lt: sessionCutoff } },
        });
        results.sessionsDeleted = sessionsDeleted;

        // 2. Stale jobs (completed/failed older than 7 days)
        const jobCutoff = new Date();
        jobCutoff.setDate(jobCutoff.getDate() - 7);
        const { count: jobsDeleted } = await prisma.job.deleteMany({
            where: {
                status: { in: ['completed', 'failed'] },
                completedAt: { lt: jobCutoff },
            },
        });
        results.jobsDeleted = jobsDeleted;

        // 3. Stale locks (older than 1 hour — should be released by workers)
        const lockCutoff = new Date();
        lockCutoff.setHours(lockCutoff.getHours() - 1);
        const { count: locksDeleted } = await prisma.lock.deleteMany({
            where: { acquiredAt: { lt: lockCutoff } },
        });
        results.locksDeleted = locksDeleted;

        // 4. Old analytics events (>6 months)
        const analyticsCutoff = new Date();
        analyticsCutoff.setMonth(analyticsCutoff.getMonth() - 6);
        const { count: analyticsDeleted } = await prisma.analyticsEvent.deleteMany({
            where: { createdAt: { lt: analyticsCutoff } },
        });
        results.analyticsDeleted = analyticsDeleted;

        // 5. Old audit logs (>1 year)
        const auditCutoff = new Date();
        auditCutoff.setFullYear(auditCutoff.getFullYear() - 1);
        const { count: auditDeleted } = await prisma.auditLog.deleteMany({
            where: { timestamp: { lt: auditCutoff } },
        });
        results.auditDeleted = auditDeleted;

        // 6. Old incidents (>90 days)
        const incidentCutoff = new Date();
        incidentCutoff.setDate(incidentCutoff.getDate() - 90);
        const { count: incidentsDeleted } = await prisma.incident.deleteMany({
            where: { createdAt: { lt: incidentCutoff } },
        });
        results.incidentsDeleted = incidentsDeleted;

        // 7. Expired waitlist entries
        const { count: waitlistDeleted } = await prisma.waitlistEntry.deleteMany({
            where: { status: 'expired' },
        });
        results.waitlistDeleted = waitlistDeleted;

        // 8. Old device fingerprints (>90 days, for users inactive >90 days)
        const deviceCutoff = new Date();
        deviceCutoff.setDate(deviceCutoff.getDate() - 90);
        const { count: devicesDeleted } = await prisma.deviceFingerprint.deleteMany({
            where: { lastSeen: { lt: deviceCutoff } },
        });
        results.devicesDeleted = devicesDeleted;

        return NextResponse.json(results);
    } catch (error) {
        console.error('[cron/cleanup-sessions]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
