import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/safety/experience — Get user's experience metrics
export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Get user's matches
        const matches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { id: true, createdAt: true }
        });

        const matchIds = matches.map(m => m.id);

        // Get messages sent and received
        const [messagesSent, messagesReceived] = await Promise.all([
            prisma.message.count({
                where: { senderId: user.id, createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.message.count({
                where: { matchId: { in: matchIds }, senderId: { not: user.id }, createdAt: { gte: thirtyDaysAgo } }
            })
        ]);

        // Calculate reply rate (messages sent / messages received, capped at 100%)
        const replyRate = messagesReceived > 0
            ? Math.min(100, Math.round((messagesSent / messagesReceived) * 100))
            : 0;

        // Get likes received
        const likesReceived = await prisma.interaction.count({
            where: { toUserId: user.id, type: { in: ['like', 'superlike'] }, createdAt: { gte: thirtyDaysAgo } }
        });

        // Get reports received (against this user)
        const reportsReceived = await prisma.report.count({
            where: { reportedId: user.id, createdAt: { gte: thirtyDaysAgo } }
        });

        // Get blocks received (by other users against this user)
        const blocksReceived = await prisma.block.count({
            where: { blockedId: user.id }
        });

        // Calculate respect score (inverse of reports + blocks)
        const respectScore = Math.max(0, 100 - (reportsReceived * 10) - (blocksReceived * 5));

        // Get conversation quality (matches with 5+ messages)
        const activeConversations = await prisma.message.groupBy({
            by: ['matchId'],
            where: { matchId: { in: matchIds } },
            _count: { id: true },
            having: { id: { _count: { gte: 5 } } }
        });

        const conversationQuality = matches.length > 0
            ? Math.round((activeConversations.length / matches.length) * 100)
            : 0;

        return NextResponse.json({
            metrics: {
                likesReceived,
                matchesCount: matches.length,
                messagesSent,
                messagesReceived,
                replyRate,
                respectScore,
                conversationQuality,
                reportsReceived,
                blocksReceived,
            },
            period: 'Ultimos 30 dias',
            hasEnoughData: matches.length >= 3 && messagesSent >= 10
        });

    } catch (error) {
        console.error('Error getting experience metrics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
