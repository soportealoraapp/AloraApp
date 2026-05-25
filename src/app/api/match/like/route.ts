import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// POST /api/match/like
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'like');
    if (rateLimitResponse) return rateLimitResponse;

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
            matched = true;

            const [u1, u2] = [user.id, toUserId].sort();

            try {
                const match = await prisma.match.upsert({
                    where: {
                        user1Id_user2Id: {
                            user1Id: u1,
                            user2Id: u2
                        }
                    },
                    update: { isActive: true, stage: 'talking' },
                    create: {
                        user1Id: u1,
                        user2Id: u2,
                        isActive: true,
                        stage: 'talking',
                        score: 0
                    }
                });
                matchId = match.id;
            } catch (matchError: any) {
                if (matchError.code === 'P2002') {
                    const existing = await prisma.match.findFirst({
                        where: {
                            OR: [
                                { user1Id: u1, user2Id: u2 },
                                { user1Id: u2, user2Id: u1 }
                            ]
                        }
                    });
                    if (existing) {
                        matchId = existing.id;
                        matched = true;
                    }
                } else {
                    throw matchError;
                }
            }
        }

        return NextResponse.json({ matched, matchId });

    } catch (error) {
        console.error('Error sending like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
