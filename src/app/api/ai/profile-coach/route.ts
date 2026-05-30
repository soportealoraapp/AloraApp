import { NextResponse } from 'next/server';
import { analyzeProfile } from '@/ai/copilot/profile-coach';
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

        // Rate limit: 3 calls per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCalls = await prisma.analyticsEvent.count({
            where: {
                userId: user.id,
                event: 'profile_coach_call',
                timestamp: { gte: today }
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
            data: { userId: user.id, event: 'profile_coach_call', timestamp: new Date() }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in profile coach:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
