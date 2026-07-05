import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        const profileIds = favorites.map(f => f.profileId);

        const profiles = await prisma.profile.findMany({
            where: { userId: { in: profileIds } },
            select: {
                userId: true,
                displayName: true,
                age: true,
                city: true,
                photos: true,
                isVerified: true,
            },
        });

        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        const result = favorites.map(f => {
            const profile = profileMap.get(f.profileId);
            return {
                id: f.profileId,
                name: profile?.displayName || 'Usuario',
                age: profile?.age,
                city: profile?.city,
                photo: profile?.photos?.[0] || '/placeholder.svg',
                isVerified: profile?.isVerified || false,
                savedAt: f.createdAt,
            };
        });

        return NextResponse.json({ favorites: result });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ favorites: [] });
    }
}

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { profileId } = await request.json();

        if (!profileId) {
            return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
        }

        if (profileId === user.id) {
            return NextResponse.json({ error: 'Cannot favorite yourself' }, { status: 400 });
        }

        const existing = await prisma.favorite.findUnique({
            where: {
                userId_profileId: {
                    userId: user.id,
                    profileId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ favorited: true, message: 'Already favorited' });
        }

        // Limit favorites for free users
        const { ensureSubscriptionState } = await import('@/lib/subscription-helper');
        await ensureSubscriptionState(user.id);
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { subscriptionStatus: true },
        });
        if (profile?.subscriptionStatus === 'free') {
            const count = await prisma.favorite.count({ where: { userId: user.id } });
            if (count >= 20) {
                return NextResponse.json({ error: 'Límite de favoritos alcanzado', message: 'Los usuarios free pueden guardar hasta 20 favoritos. Actualiza a Plus para guardar ilimitados.' }, { status: 429 });
            }
        }

        await prisma.favorite.create({
            data: {
                userId: user.id,
                profileId,
            },
        });

        return NextResponse.json({ favorited: true });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get('profileId');

        if (!profileId) {
            return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
        }

        await prisma.favorite.deleteMany({
            where: {
                userId: user.id,
                profileId,
            },
        });

        return NextResponse.json({ favorited: false });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
