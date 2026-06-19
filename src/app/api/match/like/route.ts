import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { notifyNewMatch, notifyLikeReceived, notifyLikesRestored } from '@/server/services/push';
import { trackEvent } from '@/server/services/analytics';
import { AnalyticsEvents } from '@/lib/tracking/events';
import { LikeSchema } from '@/lib/schemas/validation';

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
        const parsed = LikeSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid like payload', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const { toUserId, type, intent } = parsed.data;
        const interactionType = type || 'like';

        // Daily likes limit for free users (atomic check-and-increment to prevent race conditions)
        if (interactionType !== 'pass') {
            const profileBefore = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { subscriptionStatus: true, dailyLikesUsed: true, dailyLikesResetAt: true }
            });

            if (profileBefore && profileBefore.subscriptionStatus === 'free') {
                const now = new Date();
                const lastReset = profileBefore.dailyLikesResetAt;
                const isNewDay = !lastReset || now.toDateString() !== lastReset.toDateString();

                if (isNewDay) {
                    await prisma.profile.update({
                        where: { userId: user.id },
                        data: { dailyLikesUsed: 0, dailyLikesResetAt: now, superlikesRemaining: 3 }
                    });
                    if (profileBefore.dailyLikesUsed > 0) {
                        notifyLikesRestored(user.id)
                            .catch((err) => console.warn('[match/like] notifyLikesRestored failed:', err));
                    }
                } else if (profileBefore.dailyLikesUsed >= FREE_DAILY_LIKES_LIMIT) {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    const retryAfter = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);

                    return NextResponse.json(
                        {
                            error: 'Daily like limit reached',
                            retryAfter,
                            message: `Has alcanzado el límite de ${FREE_DAILY_LIKES_LIMIT} likes diarios. Tus likes se reinician mañana.`
                        },
                        { status: 429 }
                    );
                }

                // Atomic increment to prevent race conditions between concurrent requests
                const updated = await prisma.profile.updateMany({
                    where: {
                        userId: user.id,
                        dailyLikesUsed: { lt: FREE_DAILY_LIKES_LIMIT }
                    },
                    data: {
                        dailyLikesUsed: { increment: 1 },
                        lastSwipeAt: new Date(),
                    }
                });

                if (updated.count === 0) {
                    // Race condition caught: another request consumed the last like
                    return NextResponse.json(
                        {
                            error: 'Daily like limit reached',
                            message: `Has alcanzado el límite de ${FREE_DAILY_LIKES_LIMIT} likes diarios.`
                        },
                        { status: 429 }
                    );
                }
            }

            // Superlike limit: 3 per day for free users (outside free block so it applies to all)
            if (interactionType === 'superlike') {
                const profileSuper = await prisma.profile.findUnique({
                    where: { userId: user.id },
                    select: { superlikesRemaining: true, subscriptionStatus: true }
                });
                if (profileSuper?.subscriptionStatus === 'free' && (profileSuper?.superlikesRemaining ?? 0) <= 0) {
                    return NextResponse.json(
                        { error: 'Flechado limit reached', message: 'Has agotado tus Flechados diarios.' },
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

        // Validate target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: toUserId },
            select: { id: true }
        });
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Create/Update Interaction (idempotent via upsert)
        const interaction = await prisma.interaction.upsert({
            where: {
                fromUserId_toUserId_intent: {
                    fromUserId: user.id,
                    toUserId,
                    intent
                }
            },
            update: { type: interactionType, deletedAt: null },
            create: {
                fromUserId: user.id,
                toUserId,
                type: interactionType,
                intent
            }
        });

        // Track last swipe + decrement superlikes if applicable (only for free users)
        const currentProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { subscriptionStatus: true }
        });
        await prisma.profile.update({
            where: { userId: user.id },
            data: {
                lastSwipeId: interaction.id,
                ...(interactionType === 'superlike' && currentProfile?.subscriptionStatus !== 'plus'
                    ? { superlikesRemaining: { decrement: 1 } }
                    : {}),
            }
        }).catch((err) => console.warn('[match/like] profile update failed:', err));

        if (interactionType === 'pass') {
            return NextResponse.json({ matched: false, intent });
        }

        // 2. Atomic transaction: check reciprocal like + create match.
        type MatchResult = { matched: true; matchId: string; u1: string; u2: string } | { matched: false; matchId: null; u1?: undefined; u2?: undefined };
        const result: MatchResult = await prisma.$transaction(async (tx) => {
            const mutual = await tx.interaction.findFirst({
                where: {
                    fromUserId: toUserId,
                    toUserId: user.id,
                    intent,
                    type: { in: ['like', 'superlike'] },
                    deletedAt: null
                }
            });

            if (!mutual) {
                return { matched: false as const, matchId: null };
            }

            const [u1, u2] = [user.id, toUserId].sort();
            const match = await tx.match.upsert({
                where: {
                    user1Id_user2Id_intent: {
                        user1Id: u1,
                        user2Id: u2,
                        intent
                    }
                },
                update: { isActive: true, stage: 'talking', deletedAt: null },
                create: {
                    user1Id: u1,
                    user2Id: u2,
                    intent,
                    isActive: true,
                    stage: 'talking',
                    score: 0
                }
            });

            return { matched: true as const, matchId: match.id, u1, u2 };
        }, { isolationLevel: 'Serializable' });

        if (!result.matched) {
            // Notify recipient that someone liked them (fire-and-forget)
            prisma.profile.findUnique({ where: { userId: user.id }, select: { displayName: true } })
                .then((senderProfile) => {
                    if (senderProfile?.displayName) {
                        notifyLikeReceived(toUserId, senderProfile.displayName, user.id, intent)
                            .catch((err) => console.warn('[match/like] notifyLikeReceived failed:', err));
                    }
                })
                .catch(() => {});
            return NextResponse.json({ matched: false, matchId: null, intent });
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
            notifyNewMatch(result.u1, partner2?.displayName || 'Alguien', result.matchId, intent),
            notifyNewMatch(result.u2, partner1?.displayName || 'Alguien', result.matchId, intent),
            trackEvent(result.u1, AnalyticsEvents.FIRST_MATCH, { matchId: result.matchId, intent }),
            trackEvent(result.u2, AnalyticsEvents.FIRST_MATCH, { matchId: result.matchId, intent }),
        ]);
        settled.forEach((s, idx) => {
            if (s.status === 'rejected') {
                const names = ['notifyNewMatch#1', 'notifyNewMatch#2', 'trackEvent#1', 'trackEvent#2'];
                console.warn(`[match/like] ${names[idx]} failed:`, s.reason);
            }
        });

        return NextResponse.json({ matched: true, matchId: result.matchId, intent });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : '';
        console.error('[match/like] Error:', message, '\nStack:', stack);
        return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
    }
}
