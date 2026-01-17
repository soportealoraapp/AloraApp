import { NextRequest, NextResponse } from 'next/server';
import { getDynamicFeed } from '@/server/actions/feed';
import { prisma } from '@/lib/prisma';

// GET /api/discover
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (search) {
            // Simple search by interests or name
            const profiles = await prisma.profile.findMany({
                where: {
                    userId: { not: user.id },
                    OR: [
                        { displayName: { contains: search, mode: 'insensitive' } },
                        { interests: { has: search } }
                    ]
                },
                take: limit,
                include: { user: true }
            });

            // Format to match feed structure (without score)
            return NextResponse.json(profiles.map(p => ({
                profile: { ...p, id: p.userId, uid: p.userId, photos: p.photos || [] },
                score: { total: 0, details: {}, explanation: [] }
            })));
        }

        // Default Feed
        const feed = await getDynamicFeed(user.id);
        return NextResponse.json(feed.slice(0, limit));

    } catch (error) {
        console.error('Error getting discover feed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
