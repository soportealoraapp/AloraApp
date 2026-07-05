import { NextResponse } from 'next/server';
import { analyzeProfile } from '@/ai/copilot/profile-coach';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { getServerUser } from '@/lib/middleware/auth';
import { ensureSubscriptionState } from '@/lib/subscription-helper';

export async function POST(_request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await withRateLimit(user.id, 'ai');
        if (rateLimitResponse) return rateLimitResponse;

        const { subscriptionStatus } = await ensureSubscriptionState(user.id);
        if (subscriptionStatus !== 'plus') {
            return NextResponse.json({ error: 'Requiere Alora Plus', code: 'subscription_required' }, { status: 403 });
        }

        // Rate limit: 3 calls per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCalls = await prisma.analyticsEvent.count({
            where: {
                userId: user.id,
                event: 'profile_coach_call',
                createdAt: { gte: today }
            }
        });

        if (todayCalls >= 3) {
            return NextResponse.json({ error: 'Límite diario alcanzado (3 llamadas/día)' }, { status: 429 });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                displayName: true, bio: true, interests: true,
                values: true, photos: true, education: true, city: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const result = await analyzeProfile({
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            interests: profile.interests,
            values: profile.values,
            photos: profile.photos,
            education: profile.education || undefined,
            city: profile.city || undefined,
        });

        // Log the call
        await prisma.analyticsEvent.create({
            data: { userId: user.id, event: 'profile_coach_call', createdAt: new Date() }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in profile coach:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
