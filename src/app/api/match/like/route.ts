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

    const { ensureSubscriptionState } = await import('@/lib/subscription-helper');
    await ensureSubscriptionState(user.id);

    const rateLimitResponse = await withRateLimit(user.id, 'like');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { toUserId, type } = await request.json();

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
                const isNewDay = !lastReset || now.toDateString() !== lastReset.toDateString();

                if (isNewDay) {
                    const previousLikesUsed = profile.dailyLikesUsed;
                    await prisma.profile.update({
                        where: { userId: user.id },
                        data: { dailyLikesUsed: 0, dailyLikesResetAt: now }
                    });
                    if (previousLikesUsed > 0) {
                        notifyLikesRestored(user.id)
                            .catch((err) => console.warn('[match/like] notifyLikesRestored failed:', err));
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

        // 1. Create/Update Interaction (idempotent via upsert)
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
        }).catch((err) => console.warn('[match/like] lastSwipe update failed:', err));

        // Increment daily likes counter for free users
        if (interactionType !== 'pass') {
            await prisma.profile.update({
                where: { userId: user.id },
                data: { dailyLikesUsed: { increment: 1 } }
            }).catch((err) => console.warn('[match/like] dailyLikesUsed increment failed:', err));
        }

        if (interactionType === 'pass') {
            return NextResponse.json({ matched: false });
        }

        // 2. Atomic transaction: check reciprocal like + create match.
        type MatchResult = { matched: true; matchId: string; u1: string; u2: string } | { matched: false; matchId: null; u1?: undefined; u2?: undefined };
        const result: MatchResult = await prisma.$transaction(async (tx) => {
            const mutual = await tx.interaction.findUnique({
                where: {
                    fromUserId_toUserId: {
                        fromUserId: toUserId,
                        toUserId: user.id
                    }
                }
            });

            if (!mutual || !['like', 'superlike'].includes(mutual.type)) {
                return { matched: false as const, matchId: null };
            }

            const [u1, u2] = [user.id, toUserId].sort();
            const match = await tx.match.upsert({
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

            return { matched: true as const, matchId: match.id, u1, u2 };
        }, { isolationLevel: 'Serializable' });

        if (!result.matched) {
            return NextResponse.json({ matched: false, matchId: null });
        }

        // Compute and persist real compatibility score (outside critical path)
        try {
            const { calculateCompatibility } = await import('@/lib/compatibility/engine');
            const compat = await calculateCompatibility(result.u1, result.u2);
            await prisma.match.update({
                where: { id: result.matchId },
                data: { score: compat.totalScore },
            }).catch(() => {});
        } catch (err) {
            console.warn('[match/like] calculateCompatibility failed:', err);
        }

        // Send push notifications to both users (fire-and-forget, non-critical)
        const [partner1, partner2] = await Promise.allSettled([
            prisma.profile.findUnique({ where: { userId: result.u1 }, select: { displayName: true } }),
            prisma.profile.findUnique({ where: { userId: result.u2 }, select: { displayName: true } }),
        ]).then(r => r.map(p => p.status === 'fulfilled' ? p.value : null));

        const settled = await Promise.allSettled([
            notifyNewMatch(result.u1, partner2?.displayName || 'Alguien', result.matchId),
            notifyNewMatch(result.u2, partner1?.displayName || 'Alguien', result.matchId),
            notifyNewMatch(result.u1, partner2?.displayName || 'Alguien', result.matchId),
            notifyNewMatch(result.u2, partner1?.displayName || 'Alguien', result.matchId),
            trackEvent(result.u1, 'first_match', { matchId: result.matchId }),
            trackEvent(result.u2, 'first_match', { matchId: result.matchId }),
        ]);
        settled.forEach((s, idx) => {
            if (s.status === 'rejected') {
                const names = ['notifyNewMatch#1', 'notifyNewMatch#2', 'trackEvent#1', 'trackEvent#2'];
                console.warn(`[match/like] ${names[idx]} failed:`, s.reason);
            }
        });

        return NextResponse.json({ matched: true, matchId: result.matchId });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : '';
        console.error('[match/like] Error:', message, '\nStack:', stack);
        return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
    }
}
