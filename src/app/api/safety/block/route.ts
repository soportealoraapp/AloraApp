import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { blockedId, reason } = await request.json();

        if (!blockedId) {
            return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });
        }

        if (blockedId === user.id) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        // Create block record
        await prisma.block.upsert({
            where: {
                blockerId_blockedId: {
                    blockerId: user.id,
                    blockedId,
                }
            },
            update: { reason: reason || null },
            create: {
                blockerId: user.id,
                blockedId,
                reason: reason || null,
            }
        });

        // Soft-delete any active match between them
        await prisma.match.updateMany({
            where: {
                OR: [
                    { user1Id: user.id, user2Id: blockedId, isActive: true },
                    { user1Id: blockedId, user2Id: user.id, isActive: true },
                ]
            },
            data: {
                isActive: false,
                stage: 'unmatched',
                deletedAt: new Date(),
            }
        });

        // Delete only notifications related to the match between these two users
        const matchBetween = await prisma.match.findFirst({
            where: {
                OR: [
                    { user1Id: user.id, user2Id: blockedId },
                    { user1Id: blockedId, user2Id: user.id },
                ]
            },
            select: { id: true }
        });

        if (matchBetween) {
            await prisma.notification.deleteMany({
                where: {
                    OR: [
                        { userId: user.id, data: { path: ['matchId'], equals: matchBetween.id } },
                        { userId: blockedId, data: { path: ['matchId'], equals: matchBetween.id } },
                    ]
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
