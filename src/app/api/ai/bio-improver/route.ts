import { NextResponse } from 'next/server';
import { improveBio } from '@/ai/copilot/bio-improver';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit: 5 calls per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCalls = await prisma.analyticsEvent.count({
            where: {
                userId: user.id,
                event: 'bio_improver_call',
                timestamp: { gte: today }
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
            data: { userId: user.id, event: 'bio_improver_call', timestamp: new Date() }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in bio improver:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
