import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ========== DEVICE FINGERPRINTING ==========

export interface DeviceFingerprintInput {
    userAgent?: string;
    platform?: string;
    language?: string;
    timezone?: string;
    screenSize?: string;
    ipAddress?: string;
}

export function generateDeviceHash(input: DeviceFingerprintInput): string {
    const raw = [
        input.userAgent || '',
        input.platform || '',
        input.language || '',
        input.screenSize || '',
    ].join('|');
    return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function recordDeviceFingerprint(userId: string, input: DeviceFingerprintInput) {
    const deviceHash = generateDeviceHash(input);

    // Check if this hash is associated with other users (multi-account detection)
    const otherUsersWithDevice = await prisma.deviceFingerprint.findMany({
        where: { deviceHash, userId: { not: userId } },
        select: { userId: true },
        distinct: ['userId'],
    });

    if (otherUsersWithDevice.length > 0) {
        // Use transaction for atomicity
        await prisma.$transaction([
            prisma.auditLog.create({
                data: {
                    userId,
                    action: 'multi_account_detected',
                    details: {
                        deviceHash,
                        sharedWithUsers: otherUsersWithDevice.map(u => u.userId),
                        timestamp: new Date().toISOString(),
                    },
                }
            }),
            prisma.profile.update({
                where: { userId },
                data: { reputationScore: { decrement: 15 } },
            }),
        ]);
    }

    // Atomic upsert to prevent race conditions
    await prisma.deviceFingerprint.upsert({
        where: {
            userId_deviceHash: { userId, deviceHash },
        },
        update: {
            lastSeen: new Date(),
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        },
        create: {
            userId,
            deviceHash,
            os: input.platform,
            browser: input.userAgent?.split('/')[0],
            timezone: input.timezone,
            language: input.language,
            screenSize: input.screenSize,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        },
    });

    return { deviceHash, sharedAccounts: otherUsersWithDevice.length };
}

// ========== REPUTATION ENGINE ==========

export async function calculateReputation(userId: string): Promise<number> {
    const [profile, reports, blocks, messages, matches] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.report.count({ where: { reportedId: userId, status: { not: 'dismissed' } } }),
        prisma.block.count({ where: { blockedId: userId } }),
        prisma.message.count({ where: { senderId: userId } }),
        prisma.match.count({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
                isActive: true,
            }
        }),
    ]);

    if (!profile) return 0;

    let score = 100;

    // Deductions
    score -= reports * 10;              // -10 per valid report
    score -= blocks * 5;                // -5 per block received (others blocked this user)
    if (profile.trustStatus === 'watchlist') score -= 30;
    if (profile.isShadowBanned) score -= 40;

    // Bonuses
    if (profile.isVerified) score += 15;
    if (profile.photos.length >= 3) score += 10;
    if (profile.bio && profile.bio.length > 50) score += 5;
    if (messages > 50) score += 5;      // Active communicator
    if (messages > 200) score += 5;
    if (matches > 5) score += 5;        // Popular
    if (profile.subscriptionStatus === 'premium') score += 10;

    return Math.max(0, Math.min(100, score));
}

export async function updateReputation(userId: string) {
    const score = await calculateReputation(userId);
    await prisma.profile.update({
        where: { userId },
        data: { reputationScore: score },
    });
    return score;
}

// ========== SPAM DETECTION ==========

export async function detectSpamBehavior(userId: string, action: string): Promise<{ isSpam: boolean; reason?: string }> {
    const windowMinutes = 5;
    const since = new Date(Date.now() - windowMinutes * 60000);

    switch (action) {
        case 'like': {
            const recentLikes = await prisma.interaction.count({
                where: { fromUserId: userId, type: 'like', createdAt: { gte: since } },
            });
            if (recentLikes > 30) {
                return { isSpam: true, reason: 'Mass liking detected' };
            }
            return { isSpam: false };
        }

        case 'message': {
            const recentMessages = await prisma.message.count({
                where: { senderId: userId, createdAt: { gte: since } },
            });
            if (recentMessages > 20) {
                return { isSpam: true, reason: 'Rapid-fire messaging detected' };
            }

            // Check for copy-paste spam (same message sent to multiple matches)
            if (recentMessages > 5) {
                const lastMessages = await prisma.message.findMany({
                    where: { senderId: userId },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: { content: true },
                });
                const uniqueContents = new Set(lastMessages.map(m => m.content));
                if (uniqueContents.size <= 2 && lastMessages.length >= 5) {
                    return { isSpam: true, reason: 'Copy-paste spam detected' };
                }
            }
            return { isSpam: false };
        }

        default:
            return { isSpam: false };
    }
}

// ========== AUTO-ACTIONS ==========

export async function applyAutoActions(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    const score = profile.reputationScore;

    if (score < 20) {
        // Heavy restrictions - use transaction
        await prisma.$transaction([
            prisma.profile.update({
                where: { userId },
                data: { isShadowBanned: true, trustStatus: 'watchlist' },
            }),
            prisma.auditLog.create({
                data: {
                    userId,
                    action: 'auto_action_shadowban',
                    details: { score, reason: 'reputation below 20' },
                }
            }),
        ]);
    } else if (score < 30) {
        // Significant restrictions - use transaction
        await prisma.$transaction([
            prisma.profile.update({
                where: { userId },
                data: {
                    trustStatus: 'watchlist',
                    dailyLikesUsed: 0,
                },
            }),
            prisma.auditLog.create({
                data: {
                    userId,
                    action: 'auto_action_restricted',
                    details: { score, reason: 'reputation below 30' },
                }
            }),
        ]);
    } else if (score < 40) {
        // Moderate restrictions
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'auto_action_warning',
                details: { score, reason: 'reputation below 40' },
            }
        });
    }
}
