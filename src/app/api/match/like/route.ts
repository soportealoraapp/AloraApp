import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { notifyNewMatch, notifyLikesRestored } from '@/server/services/push';
import { trackEvent } from '@/server/services/analytics';

const FREE_DAILY_LIKES_LIMIT = 50;

// POST /api/match/like
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'like');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { toUserId, type } = await request.json(); // type: 'like' | 'superlike' | 'pass'

        if (!toUserId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const interactionType = type || 'like';

        // Daily likes limit for free users (skip for passes)
        if (interactionType !== 'pass') {
            const profile = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { subscriptionStatus: true, dailyLikesUsed: true, dailyLikesResetAt: true }
            });

            if (profile && profile.subscriptionStatus === 'free') {
                const now = new Date();
                const lastReset = profile.dailyLikesResetAt;
                const isNewDay = now.toDateString() !== lastReset.toDateString();

                if (isNewDay) {
                    const previousLikesUsed = profile.dailyLikesUsed;
                    await prisma.profile.update({
                        where: { userId: user.id },
                        data: { dailyLikesUsed: 0, dailyLikesResetAt: now }
                    });
                    if (previousLikesUsed > 0) {
                        notifyLikesRestored(user.id).catch(() => {});
                    }
                } else if (profile.dailyLikesUsed >= FREE_DAILY_LIKES_LIMIT) {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    const retryAfter = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);

                    return NextResponse.json(
                        {
                            error: 'Daily like limit reached',
                            retryAfter,
                            message: `Has alcanzado el limite de ${FREE_DAILY_LIKES_LIMIT} likes diarios. Tus likes se reinician manana.`
                        },
                        { status: 429 }
                    );
                }
            }
        }

        // Block check: prevent interaction with blocked users
        const blockExists = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: user.id, blockedId: toUserId },
                    { blockerId: toUserId, blockedId: user.id }
                ]
            }
        });

        if (blockExists) {
            return NextResponse.json({ error: 'Interaction not available' }, { status: 403 });
        }

        // 1. Create/Update Interaction
        const interaction = await prisma.interaction.upsert({
            where: {
                fromUserId_toUserId: {
                    fromUserId: user.id,
                    toUserId
                }
            },
            update: { type: interactionType },
            create: {
                fromUserId: user.id,
                toUserId,
                type: interactionType
            }
        });

        // Track last swipe for rewind feature
        await prisma.profile.update({
            where: { userId: user.id },
            data: {
                lastSwipeId: interaction.id,
                lastSwipeAt: new Date(),
            }
        }).catch(() => {});

        // Increment daily likes counter for free users
        if (interactionType !== 'pass') {
            await prisma.profile.update({
                where: { userId: user.id },
                data: { dailyLikesUsed: { increment: 1 } }
            }).catch(() => {}); // Ignore errors on counter increment
        }

        if (interactionType === 'pass') {
            return NextResponse.json({ matched: false });
        }

        // 2. Check for Mutual Like
        const mutualInteraction = await prisma.interaction.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: toUserId,
                    toUserId: user.id
                }
            }
        });

        let matched = false;
        let matchId = null;

        if (mutualInteraction && ['like', 'superlike'].includes(mutualInteraction.type)) {
            matched = true;

            const [u1, u2] = [user.id, toUserId].sort();

            try {
                const match = await prisma.match.upsert({
                    where: {
                        user1Id_user2Id: {
                            user1Id: u1,
                            user2Id: u2
                        }
                    },
                    update: { isActive: true, stage: 'talking' },
                    create: {
                        user1Id: u1,
                        user2Id: u2,
                        isActive: true,
                        stage: 'talking',
                        score: 0
                    }
                });
                matchId = match.id;

                // Send push notifications to both users
                const [partner1, partner2] = await Promise.all([
                    prisma.profile.findUnique({ where: { userId: u1 }, select: { displayName: true } }),
                    prisma.profile.findUnique({ where: { userId: u2 }, select: { displayName: true } }),
                ]);

                Promise.allSettled([
                    notifyNewMatch(u1, partner2?.displayName || 'Alguien', match.id),
                    notifyNewMatch(u2, partner1?.displayName || 'Alguien', match.id),
                    trackEvent(u1, 'first_match', { matchId: match.id }),
                    trackEvent(u2, 'first_match', { matchId: match.id }),
                ]);
            } catch (matchError: any) {
                if (matchError.code === 'P2002') {
                    const existing = await prisma.match.findFirst({
                        where: {
                            OR: [
                                { user1Id: u1, user2Id: u2 },
                                { user1Id: u2, user2Id: u1 }
                            ]
                        }
                    });
                    if (existing) {
                        matchId = existing.id;
                        matched = true;
                    }
                } else {
                    throw matchError;
                }
            }
        }

        return NextResponse.json({ matched, matchId });

    } catch (error) {
        console.error('Error sending like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
