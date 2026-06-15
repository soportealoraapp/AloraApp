import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { matchId } = await request.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true, hiddenBy: true },
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Add user to hiddenBy array if not already present
        if (!match.hiddenBy.includes(user.id)) {
            await prisma.match.update({
                where: { id: matchId },
                data: {
                    hiddenBy: { push: user.id }
                }
            });
        }

        return NextResponse.json({ success: true, matchId });
    } catch (error) {
        console.error('Error hiding conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
