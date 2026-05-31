import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { filterOffensiveMessages } from '@/ai/flows/filter-offensive-messages';
import { analyzeMessageSafety } from '@/ai/safety-engine/risk-engine';
import { notifyNewMessage } from '@/server/services/push';
import { trackEvent } from '@/server/services/analytics';

// POST /api/chat/send
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'send');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { matchId, text, type } = await request.json();

        if (!matchId || !text) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify match ownership
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { user1: true, user2: true }
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 403 });
        }

        // Block check: ensure neither user has blocked the other
        const receiverId = match.user1Id === user.id ? match.user2Id : match.user1Id;
        const blockExists = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: user.id, blockedId: receiverId },
                    { blockerId: receiverId, blockedId: user.id }
                ]
            }
        });

        if (blockExists) {
            return NextResponse.json({ error: 'Interaction not available' }, { status: 403 });
        }

        // Women-first: in heterosexual matches, only the woman can send the first message
        const prevMessageCount = await prisma.message.count({ where: { matchId } });
        if (prevMessageCount === 0) {
            const [senderProfile, receiverProfile] = await Promise.all([
                prisma.profile.findUnique({ where: { userId: user.id }, select: { gender: true } }),
                prisma.profile.findUnique({ where: { userId: receiverId }, select: { gender: true } }),
            ]);

            const isHeteroMatch =
                (senderProfile?.gender === 'male' && receiverProfile?.gender === 'female') ||
                (senderProfile?.gender === 'female' && receiverProfile?.gender === 'male');

            if (isHeteroMatch && senderProfile?.gender === 'male') {
                return NextResponse.json(
                    {
                        error: 'first_message_restriction',
                        message: 'En conexiones entre hombres y mujeres, ella da el primer paso 💬'
                    },
                    { status: 403 }
                );
            }
        }

        // Moderate message content
        let content = text;
        let isFiltered = false;
        try {
            const moderationResult = await filterOffensiveMessages({ text });
            content = moderationResult.filteredText;
            isFiltered = moderationResult.isOffensive;
        } catch (moderationError) {
            console.error('Moderation error:', moderationError);
        }

        // Risk engine analysis (love bombing, manipulation, scam detection)
        let isHighRisk = false;
        try {
            const prevMessageCount = await prisma.message.count({ where: { matchId } });
            const riskAssessment = await analyzeMessageSafety(
                matchId,
                user.id,
                receiverId,
                content,
                prevMessageCount
            );

            if (riskAssessment.assessment.riskLevel === 'critical' || riskAssessment.assessment.riskLevel === 'high') {
                // Flag message for review and reduce sender reputation
                isFiltered = true;
                isHighRisk = true;
                await prisma.profile.update({
                    where: { userId: user.id },
                    data: { reputationScore: { decrement: riskAssessment.assessment.riskLevel === 'critical' ? 10 : 5 } }
                }).catch(() => {});
            }
        } catch (riskError) {
            console.error('Risk engine error:', riskError);
        }

        // Create Message
        const message = await prisma.message.create({
            data: {
                matchId,
                senderId: user.id,
                content,
                type: type || 'text',
                status: isFiltered ? 'flagged' : 'sent',
            }
        });

        // Update Match updatedAt
        await prisma.match.update({
            where: { id: matchId },
            data: { updatedAt: new Date() }
        });

        // Send push notification to the other user
        const senderProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { displayName: true }
        });
        notifyNewMessage(receiverId, senderProfile?.displayName || 'Alguien', matchId, content).catch(() => {});

        // Analytics: track first_message and first_reply
        if (prevMessageCount === 0) {
            trackEvent(user.id, 'first_message', { matchId }).catch(() => {});
        } else {
            const repliesFromReceiver = await prisma.message.count({
                where: { matchId, senderId: receiverId },
            });
            if (repliesFromReceiver === 1) {
                trackEvent(receiverId, 'first_reply', { matchId }).catch(() => {});
            }
        }

        return NextResponse.json(message);

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
