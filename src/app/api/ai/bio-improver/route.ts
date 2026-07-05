import { NextResponse } from 'next/server';
import { improveBio } from '@/ai/copilot/bio-improver';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { getServerUser } from '@/lib/middleware/auth';

export async function POST(_request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await withRateLimit(user.id, 'ai');
        if (rateLimitResponse) return rateLimitResponse;

        // Rate limit: 5 calls per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCalls = await prisma.analyticsEvent.count({
            where: {
                userId: user.id,
                event: 'bio_improver_call',
                createdAt: { gte: today }
            }
        });

        if (todayCalls >= 5) {
            return NextResponse.json({ error: 'Límite diario alcanzado (5 llamadas/día)' }, { status: 429 });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                bio: true, interests: true, values: true,
                city: true, lookingFor: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const result = await improveBio({
            currentBio: profile.bio || '',
            interests: profile.interests,
            values: profile.values,
            city: profile.city || undefined,
            lookingFor: (profile as any).lookingFor || undefined,
        });

        await prisma.analyticsEvent.create({
            data: { userId: user.id, event: 'bio_improver_call', createdAt: new Date() }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in bio improver:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
