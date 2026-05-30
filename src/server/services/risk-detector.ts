import { prisma } from '@/lib/prisma';

const MAX_ACCOUNTS_PER_DEVICE = 2;
const ACCOUNT_CREATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Detect if a device is creating multiple accounts.
 * Returns { isSuspicious: boolean, accountCount: number }.
 */
export async function detectMassiveAccountCreation(
    deviceHash: string
): Promise<{ isSuspicious: boolean; accountCount: number }> {
    const windowStart = new Date(Date.now() - ACCOUNT_CREATION_WINDOW_MS);

    // Count accounts created from this device in the last 24h
    const recentFingerprints = await prisma.deviceFingerprint.findMany({
        where: {
            deviceHash,
            firstSeen: { gte: windowStart }
        },
        select: { userId: true }
    });

    const uniqueUsers = new Set(recentFingerprints.map(f => f.userId));
    const accountCount = uniqueUsers.size;

    if (accountCount > MAX_ACCOUNTS_PER_DEVICE) {
        // Log suspicious activity
        const userIds = Array.from(uniqueUsers);
        await prisma.auditLog.create({
            data: {
                userId: userIds[0], // first user
                action: 'massive_account_creation_detected',
                details: {
                    deviceHash,
                    accountCount,
                    userIds,
                },
            }
        });

        // Penalize reputation for all accounts
        for (const uid of userIds) {
            const profile = await prisma.profile.findUnique({
                where: { userId: uid },
                select: { reputationScore: true }
            });
            if (profile) {
                await prisma.profile.update({
                    where: { userId: uid },
                    data: {
                        reputationScore: Math.max(0, profile.reputationScore - 20),
                        trustStatus: 'watchlist'
                    }
                });
            }
        }

        return { isSuspicious: true, accountCount };
    }

    return { isSuspicious: false, accountCount };
}

/**
 * Check if a user has suspicious behavioral patterns.
 */
export async function detectSuspiciousBehavior(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
}> {
    const reasons: string[] = [];

    // Check for very new account with many likes
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { createdAt: true, lastActiveAt: true }
    });

    if (!profile) return { suspicious: false, reasons: [] };

    const accountAge = Date.now() - profile.createdAt.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (accountAge < oneDay) {
        // Check like count in first day
        const likeCount = await prisma.interaction.count({
            where: { fromUserId: userId, type: 'like' }
        });
        if (likeCount > 50) {
            reasons.push(`New account with ${likeCount} likes in first day`);
        }
    }

    // Check for many reports received
    const reportCount = await prisma.report.count({
        where: { reportedId: userId, status: { not: 'dismissed' } }
    });
    if (reportCount >= 2) {
        reasons.push(`${reportCount} reports received`);
    }

    // Check for many blocks received
    const blockCount = await prisma.block.count({
        where: { blockedId: userId }
    });
    if (blockCount >= 3) {
        reasons.push(`${blockCount} users blocked this account`);
    }

    return {
        suspicious: reasons.length > 0,
        reasons
    };
}
