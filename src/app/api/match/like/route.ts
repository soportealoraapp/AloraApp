import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/match/like
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { toUserId, type } = await request.json(); // type: 'like' | 'superlike' | 'pass'

        if (!toUserId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const interactionType = type || 'like';

        // 1. Create/Update Interaction
        await prisma.interaction.upsert({
            where: {
                fromUserId_toUserId: {
                    fromUserId: user.id,
                    toUserId
                }
            },
            update: { type: interactionType },
            create: {
                fromUserId: user.id,
                toUserId,
                type: interactionType
            }
        });

        if (interactionType === 'pass') {
            return NextResponse.json({ matched: false });
        }

        // 2. Check for Mutual Like
        const mutualInteraction = await prisma.interaction.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: toUserId,
                    toUserId: user.id
                }
            }
        });

        let matched = false;
        let matchId = null;

        if (mutualInteraction && ['like', 'superlike'].includes(mutualInteraction.type)) {
            // IT'S A MATCH!
            matched = true;

            // Create Match record
            // Ensure unique order or check existence
            // Schema has unique constraints on [user1Id, user2Id].
            // We usually store user1Id < user2Id or strict sender/receiver.
            // Let's sort IDs
            const [u1, u2] = [user.id, toUserId].sort();

            const match = await prisma.match.create({
                data: {
                    user1Id: u1,
                    user2Id: u2,
                    isActive: true,
                    stage: 'talking',
                    score: 0 // Could calc score here
                }
            });
            matchId = match.id;

            // Create initial system message or notification could happen here
        }

        return NextResponse.json({ matched, matchId });

    } catch (error) {
        console.error('Error sending like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
