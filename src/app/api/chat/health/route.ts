import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCompatibility } from '@/lib/compatibility/engine';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'match');
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
        return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true, score: true },
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        const messages = await prisma.message.findMany({
            where: { matchId },
            select: { senderId: true, createdAt: true, content: true },
            orderBy: { createdAt: 'asc' },
        });

        if (messages.length === 0) {
            return NextResponse.json({ score: 0, status: 'empty' });
        }

        let score = 0;

        const senders = new Set(messages.map(m => m.senderId));
        if (senders.size >= 2) {
            score += 25;
        }

        if (messages.length > 10) {
            score += 25;
        }

        const user1Count = messages.filter(m => m.senderId === match.user1Id).length;
        const user2Count = messages.filter(m => m.senderId === match.user2Id).length;
        const ratio = Math.min(user1Count, user2Count) / Math.max(user1Count, user2Count);
        if (ratio >= 0.3) {
            score += 20;
        }

        let totalResponseTime = 0;
        let responseCount = 0;
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].senderId !== messages[i - 1].senderId) {
                const diff = new Date(messages[i].createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime();
                totalResponseTime += diff;
                responseCount++;
            }
        }
        const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : Infinity;
        if (avgResponseTime < 2 * 60 * 60 * 1000) {
            score += 15;
        }

        const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id;
        let realCompatibility: number | null = null;
        try {
            const compat = await calculateCompatibility(user.id, otherUserId);
            realCompatibility = compat.totalScore;
        } catch (err) {
            console.warn('[chat/health] calculateCompatibility failed:', err);
        }
        if (realCompatibility !== null && realCompatibility >= 70) {
            score += 15;
        }

        score = Math.min(100, score);

        // Determine status
        let status = 'needs_interaction';
        if (score >= 80) status = 'excellent';
        else if (score >= 60) status = 'good';
        else if (score >= 40) status = 'early';

        return NextResponse.json({ score, status });
    } catch (error) {
        console.error('Error calculating match health:', error);
        return NextResponse.json({ score: 0, status: 'error' });
    }
}
