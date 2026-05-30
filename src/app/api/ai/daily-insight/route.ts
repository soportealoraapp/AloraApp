import { NextResponse } from 'next/server';
import { generateDailyInsight } from '@/ai/copilot/daily-insights';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit: once per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayInsight = await prisma.analyticsEvent.findFirst({
            where: {
                userId: user.id,
                event: 'daily_insight',
                createdAt: { gte: today }
            }
        });

        if (todayInsight) {
            return NextResponse.json(todayInsight.metadata || { cached: true });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                displayName: true, interests: true, values: true,
                lookingFor: true, lastActiveAt: true, bio: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get recent activity summary
        const [messageCount, matchCount, visitCount] = await Promise.all([
            prisma.message.count({
                where: { senderId: user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            }),
            prisma.match.count({
                where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            }),
            prisma.profileVisit.count({
                where: { visitedId: user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            }),
        ]);

        const recentActivity = `${messageCount} mensajes enviados, ${matchCount} matches nuevos, ${visitCount} visitas al perfil`;

        const insight = await generateDailyInsight({
            name: profile.displayName || 'usuario',
            interests: profile.interests,
            values: profile.values,
            lookingFor: (profile as any).lookingFor || undefined,
            recentActivity,
            personalityHint: profile.bio?.substring(0, 200),
        });

        // Cache the insight
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'daily_insight',
                metadata: insight as any,
            }
        });

        return NextResponse.json(insight);
    } catch (error) {
        console.error('Error generating daily insight:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
