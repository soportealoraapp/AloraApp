import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const REWIND_WINDOW_MINUTES = 5;
const FREE_DAILY_REWINDS = 1;
const PLUS_DAILY_REWINDS = 3;

// POST /api/match/rewind — Undo last swipe
export async function POST() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                subscriptionStatus: true,
                lastSwipeId: true,
                lastSwipeAt: true,
                rewindsUsed: true,
                rewindsResetAt: true,
                dailyLikesUsed: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Check if rewinds need to be reset (new day)
        const now = new Date();
        const lastReset = profile.rewindsResetAt;
        const isNewDay = now.toDateString() !== lastReset.toDateString();

        if (isNewDay) {
            await prisma.profile.update({
                where: { userId: user.id },
                data: { rewindsUsed: 0, rewindsResetAt: now }
            });
            profile.rewindsUsed = 0;
        }

        // Check rewind limit
        const maxRewinds = profile.subscriptionStatus === 'plus' ? PLUS_DAILY_REWINDS : FREE_DAILY_REWINDS;
        if (profile.rewindsUsed >= maxRewinds) {
            return NextResponse.json({
                error: 'Rewind limit reached',
                message: `Has usado todos tus rewinds diarios (${maxRewinds}).`,
                rewindsRemaining: 0
            }, { status: 429 });
        }

        // Check if last swipe exists and is within 5 minutes
        if (!profile.lastSwipeId || !profile.lastSwipeAt) {
            return NextResponse.json({
                error: 'No hay swipe reciente para deshacer',
                rewindsRemaining: maxRewinds - profile.rewindsUsed
            }, { status: 400 });
        }

        const lastSwipeTime = new Date(profile.lastSwipeAt).getTime();
        const minutesSinceSwipe = (now.getTime() - lastSwipeTime) / (1000 * 60);

        if (minutesSinceSwipe > REWIND_WINDOW_MINUTES) {
            return NextResponse.json({
                error: 'Too late',
                message: `Tu último swipe fue hace ${Math.round(minutesSinceSwipe)} minutos. Solo puedes deshacer-swipes en los primeros ${REWIND_WINDOW_MINUTES} minutos.`,
                rewindsRemaining: maxRewinds - profile.rewindsUsed
            }, { status: 400 });
        }

        // Find the interaction to undo
        const interaction = await prisma.interaction.findFirst({
            where: {
                id: profile.lastSwipeId,
                fromUserId: user.id,
                deletedAt: null
            }
        });

        if (!interaction) {
            return NextResponse.json({
                error: 'Interaction not found',
                rewindsRemaining: maxRewinds - profile.rewindsUsed
            }, { status: 404 });
        }

        // Check if this interaction created a match
        const [u1, u2] = [user.id, interaction.toUserId].sort();
        const existingMatch = await prisma.match.findFirst({
            where: {
                user1Id: u1,
                user2Id: u2,
                isActive: true
            }
        });

        // Soft-delete the interaction
        await prisma.interaction.update({
            where: { id: interaction.id },
            data: { deletedAt: now }
        });

        // If a match was created, deactivate it
        if (existingMatch) {
            await prisma.match.update({
                where: { id: existingMatch.id },
                data: {
                    isActive: false,
                    stage: 'unmatched',
                    deletedAt: now
                }
            });
        }

        // Update profile: increment rewinds, decrement daily likes, clear last swipe
        await prisma.profile.update({
            where: { userId: user.id },
            data: {
                rewindsUsed: { increment: 1 },
                dailyLikesUsed: { decrement: 1 },
                lastSwipeId: null,
                lastSwipeAt: null,
            }
        });

        // Track analytics
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'rewind_used',
                metadata: {
                    interactionType: interaction.type,
                    hadMatch: !!existingMatch,
                    minutesSinceSwipe: Math.round(minutesSinceSwipe)
                }
            }
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            undone: {
                type: interaction.type,
                targetUserId: interaction.toUserId,
                hadMatch: !!existingMatch
            },
            rewindsRemaining: maxRewinds - profile.rewindsUsed - 1
        });

    } catch (error) {
        console.error('Error rewinding swipe:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
