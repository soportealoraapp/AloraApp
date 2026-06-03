import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface TimelineEvent {
    id: string;
    type: string;
    icon: string;
    title: string;
    description?: string;
    createdAt: string;
}

export async function GET(request: NextRequest) {
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
            return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                user1Id: true,
                user2Id: true,
                createdAt: true,
                healthUpdatedAt: true,
            }
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        const events: TimelineEvent[] = [];

        events.push({
            id: `match-${match.id}`,
            type: 'match_created',
            icon: '💚',
            title: 'Match creado',
            description: 'Se hizo la conexión',
            createdAt: match.createdAt.toISOString(),
        });

        const firstMessage = await prisma.message.findFirst({
            where: { matchId: match.id },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true, senderId: true, type: true },
        });

        if (firstMessage) {
            events.push({
                id: `first-msg-${match.id}`,
                type: 'first_message',
                icon: '💬',
                title: 'Primer mensaje',
                description: firstMessage.senderId === user.id ? 'Tú lo enviaste' : 'Lo recibiste',
                createdAt: firstMessage.createdAt.toISOString(),
            });
        }

        const firstVoice = await prisma.message.findFirst({
            where: { matchId: match.id, type: 'voice' },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
        });

        if (firstVoice) {
            events.push({
                id: `first-voice-${match.id}`,
                type: 'first_voice',
                icon: '🎤',
                title: 'Primer audio',
                createdAt: firstVoice.createdAt.toISOString(),
            });
        }

        const firstImage = await prisma.message.findFirst({
            where: { matchId: match.id, type: 'image' },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
        });

        if (firstImage) {
            events.push({
                id: `first-image-${match.id}`,
                type: 'first_image',
                icon: '📸',
                title: 'Primera foto',
                createdAt: firstImage.createdAt.toISOString(),
            });
        }

        if (match.healthUpdatedAt) {
            events.push({
                id: `health-${match.id}`,
                type: 'health_calculated',
                icon: '🧪',
                title: 'Compatibilidad calculada',
                description: 'Score de salud de la conversación',
                createdAt: match.healthUpdatedAt.toISOString(),
            });
        }

        const reactions = await prisma.message.findMany({
            where: {
                matchId: match.id,
                reactions: { not: {} }
            },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { createdAt: true },
        });

        if (reactions[0]) {
            events.push({
                id: `first-react-${match.id}`,
                type: 'first_reaction',
                icon: '😄',
                title: 'Primera reacción',
                createdAt: reactions[0].createdAt.toISOString(),
            });
        }

        const compatibility = await prisma.copilotContext.findUnique({
            where: { matchId: match.id },
            select: { lastAnalyzedAt: true },
        });

        if (compatibility?.lastAnalyzedAt) {
            events.push({
                id: `ai-${match.id}`,
                type: 'ai_analyzed',
                icon: '🤖',
                title: 'Análisis de conversación',
                description: 'Tu copiloto revisó la conversación',
                createdAt: compatibility.lastAnalyzedAt.toISOString(),
            });
        }

        events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching timeline:', error);
        return NextResponse.json({ events: [] });
    }
}
