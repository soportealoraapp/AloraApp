import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOOST_DURATION_MINUTES = 30;
const FREE_BOOST_COOLDOWN_DAYS = 5;
const PLUS_BOOST_COOLDOWN_DAYS = 7;

export async function POST(request: Request) {
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
                boostExpiresAt: true,
                lastBoostAt: true,
                totalBoosts: true
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const isPlus = profile.subscriptionStatus === 'plus';
        const now = new Date();

        // Check if boost is already active
        if (profile.boostExpiresAt && profile.boostExpiresAt > now) {
            const remainingMs = profile.boostExpiresAt.getTime() - now.getTime();
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            return NextResponse.json({
                error: 'Boost already active',
                boostExpiresAt: profile.boostExpiresAt,
                remainingMinutes
            }, { status: 409 });
        }

        // Check cooldown
        const cooldownDays = isPlus ? PLUS_BOOST_COOLDOWN_DAYS : FREE_BOOST_COOLDOWN_DAYS;
        if (profile.lastBoostAt) {
            const hoursSinceLastBoost = (now.getTime() - profile.lastBoostAt.getTime()) / (1000 * 60 * 60);
            const cooldownHours = cooldownDays * 24;

            if (hoursSinceLastBoost < cooldownHours) {
                const hoursRemaining = Math.ceil(cooldownHours - hoursSinceLastBoost);
                return NextResponse.json({
                    error: 'Boost cooldown',
                    hoursRemaining,
                    message: `Tu proximo boost estara disponible en ${hoursRemaining} horas`
                }, { status: 429 });
            }
        }

        // Activate boost
        const boostExpiresAt = new Date(now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000);

        await prisma.profile.update({
            where: { userId: user.id },
            data: {
                boostExpiresAt,
                lastBoostAt: now,
                totalBoosts: { increment: 1 },
                lastActiveAt: now
            }
        });

        // Track analytics
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'boost_activated',
                metadata: {
                    timestamp: now.toISOString(),
                    isPlus,
                    totalBoosts: (profile.totalBoosts || 0) + 1
                }
            }
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            boostExpiresAt,
            durationMinutes: BOOST_DURATION_MINUTES,
            totalBoosts: (profile.totalBoosts || 0) + 1
        });
    } catch (error) {
        console.error('Error activating boost:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
