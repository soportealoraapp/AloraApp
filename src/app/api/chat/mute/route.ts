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
        const { matchId, duration } = await request.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true, mutedUntil: true, mutedByUserId: true },
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        let mutedUntil: Date | null = null;
        let mutedByUserId: string | null = null;

        if (duration === -1) {
            if (match.mutedByUserId && match.mutedByUserId !== user.id) {
                return NextResponse.json({ success: false, error: 'only_muter_can_unmute', mutedUntil: match.mutedUntil, mutedByUserId: match.mutedByUserId });
            }
            mutedUntil = null;
            mutedByUserId = null;
        } else if (duration === null) {
            if (match.mutedByUserId && match.mutedByUserId !== user.id) {
                return NextResponse.json({ success: false, error: 'another_user_muted', mutedUntil: match.mutedUntil, mutedByUserId: match.mutedByUserId });
            }
            mutedUntil = new Date('2099-12-31');
            mutedByUserId = user.id;
        } else {
            if (match.mutedByUserId && match.mutedByUserId !== user.id) {
                return NextResponse.json({ success: false, error: 'another_user_muted', mutedUntil: match.mutedUntil, mutedByUserId: match.mutedByUserId });
            }
            mutedUntil = new Date(Date.now() + duration);
            mutedByUserId = user.id;
        }

        await prisma.$executeRaw`
            UPDATE matches
            SET "mutedUntil" = ${mutedUntil}, "mutedByUserId" = ${mutedByUserId}
            WHERE id = ${matchId}
        `;

        return NextResponse.json({ success: true, mutedUntil, mutedByUserId });
    } catch (error) {
        console.error('Error muting conversation:', error);
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

    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true, mutedUntil: true, mutedByUserId: true },
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        if (match.mutedByUserId && match.mutedByUserId !== user.id) {
            return NextResponse.json({ success: false, error: 'only_muter_can_unmute' });
        }

        await prisma.$executeRaw`
            UPDATE matches
            SET "mutedUntil" = NULL, "mutedByUserId" = NULL
            WHERE id = ${matchId}
        `;

        return NextResponse.json({ success: true, mutedUntil: null, mutedByUserId: null });
    } catch (error) {
        console.error('Error unmuting conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
