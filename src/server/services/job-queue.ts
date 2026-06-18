'use server';

import { prisma } from '@/lib/prisma';

export type JobType =
    | 'send_notification'
    | 'process_analytics'
    | 'moderate_message'
    | 'ai_coaching'
    | 'cleanup_expired'
    | 'process_upload'
    | 'update_reputation';

export interface QueueJob {
    id: string;
    type: JobType;
    payload: Record<string, any>;
    priority: number; // 1 (high) - 5 (low)
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
    retries: number;
    maxRetries: number;
    scheduledAt: Date;
    createdAt: Date;
    completedAt?: Date;
    error?: string;
}

const JOB_TYPES = {
    send_notification: { maxRetries: 5, priority: 1, timeout: 30000 },
    process_analytics: { maxRetries: 3, priority: 4, timeout: 60000 },
    moderate_message: { maxRetries: 3, priority: 2, timeout: 30000 },
    ai_coaching: { maxRetries: 2, priority: 3, timeout: 120000 },
    cleanup_expired: { maxRetries: 1, priority: 5, timeout: 300000 },
    process_upload: { maxRetries: 3, priority: 2, timeout: 60000 },
    update_reputation: { maxRetries: 3, priority: 3, timeout: 30000 },
};

export class JobQueue {
    async enqueue(
        type: JobType,
        payload: Record<string, any>,
        priority?: number,
        scheduledAt?: Date,
    ): Promise<string> {
        const config = JOB_TYPES[type];
        if (!config) throw new Error(`Unknown job type: ${type}`);

        const job = await prisma.job.create({
            data: {
                type,
                payload: payload as any,
                priority: priority ?? config.priority,
                maxRetries: config.maxRetries,
                status: 'pending',
                scheduledAt: scheduledAt || new Date(),
            },
        });

        return job.id;
    }

    async dequeue(workerId: string, types?: JobType[]): Promise<QueueJob | null> {
        // Atomic claim with SKIP LOCKED to prevent duplicate processing
        const rows = types && types.length > 0
            ? await prisma.$queryRaw<{ id: string }[]>`
                UPDATE "Job"
                SET status = 'processing', "workerId" = ${workerId}, "startedAt" = NOW()
                WHERE id = (
                    SELECT id FROM "Job"
                    WHERE status = 'pending' AND "scheduledAt" <= NOW() AND type IN (${types.join(',')})
                    ORDER BY priority ASC, "createdAt" ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id
            `
            : await prisma.$queryRaw<{ id: string }[]>`
                UPDATE "Job"
                SET status = 'processing', "workerId" = ${workerId}, "startedAt" = NOW()
                WHERE id = (
                    SELECT id FROM "Job"
                    WHERE status = 'pending' AND "scheduledAt" <= NOW()
                    ORDER BY priority ASC, "createdAt" ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id
            `;

        if (rows.length === 0) return null;

        const job = await prisma.job.findUnique({ where: { id: rows[0].id } });
        if (!job) return null;

        return {
            id: job.id,
            type: job.type as JobType,
            payload: job.payload as Record<string, any>,
            priority: job.priority,
            status: 'processing',
            retries: job.retries,
            maxRetries: job.maxRetries,
            scheduledAt: job.scheduledAt,
            createdAt: job.createdAt,
        };
    }

    async complete(jobId: string, result?: Record<string, any>): Promise<void> {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'completed', completedAt: new Date(), result: result as any },
        });
    }

    async fail(jobId: string, error: string): Promise<void> {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return;

        if (job.retries < job.maxRetries) {
            // Retry with exponential backoff
            const backoffMinutes = Math.min(60, Math.pow(2, job.retries) * 5);
            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: 'retrying',
                    retries: { increment: 1 },
                    error,
                    scheduledAt: new Date(Date.now() + backoffMinutes * 60000),
                },
            });
        } else {
            // Dead letter queue
            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    error,
                    completedAt: new Date(),
                },
            });

            // Log to DLQ audit
            await prisma.auditLog.create({
                data: {
                    action: 'job_dlq',
                    details: {
                        jobId,
                        type: job.type,
                        error,
                        retries: job.retries,
                        payload: job.payload,
                    },
                },
            });
        }
    }

    async getQueueLength(type?: JobType): Promise<number> {
        const where: any = { status: 'pending' };
        if (type) where.type = type;
        return prisma.job.count({ where });
    }

    async getFailedJobs(limit: number = 20): Promise<QueueJob[]> {
        const jobs = await prisma.job.findMany({
            where: { status: 'failed' },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return jobs.map(j => ({
            id: j.id,
            type: j.type as JobType,
            payload: j.payload as Record<string, any>,
            priority: j.priority,
            status: 'failed',
            retries: j.retries,
            maxRetries: j.maxRetries,
            scheduledAt: j.scheduledAt,
            createdAt: j.createdAt,
            completedAt: j.completedAt || undefined,
            error: j.error || undefined,
        }));
    }

    async retryFailedJob(jobId: string): Promise<void> {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'pending', retries: 0, error: null, scheduledAt: new Date() },
        });
    }

    async cleanupOldJobs(retentionDays: number = 30): Promise<number> {
        const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const deleted = await prisma.job.deleteMany({
            where: {
                status: { in: ['completed', 'failed'] },
                createdAt: { lt: cutoff },
            },
        });
        return deleted.count;
    }

    // Distributed lock using advisory lock (PostgreSQL pg_try_advisory_lock)
    async acquireLock(lockName: string, ttlSeconds: number = 60): Promise<boolean> {
        try {
            // Use a DB row as a distributed lock
            const existing = await prisma.lock.findUnique({ where: { name: lockName } });

            if (existing) {
                const expired = Date.now() - existing.acquiredAt.getTime() > ttlSeconds * 1000;
                if (!expired) return false;

                // Expired — reclaim
                await prisma.lock.update({
                    where: { name: lockName },
                    data: { acquiredAt: new Date(), owner: `worker_${Date.now()}` },
                });
                return true;
            }

            await prisma.lock.create({
                data: { name: lockName, owner: `worker_${Date.now()}` },
            });
            return true;
        } catch {
            return false;
        }
    }

    async releaseLock(lockName: string): Promise<void> {
        await prisma.lock.delete({ where: { name: lockName } }).catch(() => {});
    }
}

export const jobQueue = new JobQueue();

// ========== WORKER EXECUTOR ==========

export async function processJob(job: QueueJob): Promise<void> {
    console.log(`Processing job ${job.id}: ${job.type}`);

    try {
        switch (job.type) {
            case 'cleanup_expired':
                await cleanupExpiredData();
                break;
            case 'update_reputation':
                if (job.payload.userId) {
                    const { updateReputation } = await import('@/server/services/anti-abuse');
                    await updateReputation(job.payload.userId);
                }
                break;
            case 'process_analytics':
                // Batch process analytics events
                break;
            default:
                console.log(`No processor for job type: ${job.type}`);
        }

        await jobQueue.complete(job.id);
    } catch (error: any) {
        await jobQueue.fail(job.id, error.message || 'Unknown error');
    }
}

async function cleanupExpiredData(): Promise<void> {
    const now = new Date();

    // Expire old sessions
    await prisma.session.updateMany({
        where: { expiresAt: { lt: now }, isValid: true },
        data: { isValid: false },
    });

    // Clean expired locks
    const staleLocks = await prisma.lock.findMany({
        where: { acquiredAt: { lt: new Date(Date.now() - 300000) } }, // 5 min
    });
    for (const lock of staleLocks) {
        await prisma.lock.delete({ where: { id: lock.id } }).catch(() => {});
    }

    // Archive old analytics events
    const analyticsCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await prisma.analyticsEvent.deleteMany({
        where: { createdAt: { lt: analyticsCutoff } },
    });

    // Clean up orphaned uploads
    const oldVerifications = await prisma.verificationSubmission.findMany({
        where: { status: 'pending', createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
    for (const v of oldVerifications) {
        await prisma.verificationSubmission.update({
            where: { id: v.id },
            data: { status: 'rejected', reason: 'Expired - no response' },
        });
    }

    // Clean completed jobs older than 7 days
    await jobQueue.cleanupOldJobs(7);
}

export async function startWorker(workerId: string, pollIntervalMs: number = 5000): Promise<() => void> {
    let running = true;

    const poll = async () => {
        while (running) {
            try {
                const job = await jobQueue.dequeue(workerId);
                if (job) {
                    await processJob(job);
                } else {
                    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
                }
            } catch (error) {
                console.error(`Worker ${workerId} error:`, error);
                await new Promise(resolve => setTimeout(resolve, pollIntervalMs * 2));
            }
        }
    };

    poll();

    return () => { running = false; };
}
