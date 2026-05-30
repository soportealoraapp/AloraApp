import { prisma } from '@/lib/prisma';

export interface ConversationHealth {
    matchId: string;
    status: 'thriving' | 'healthy' | 'fading' | 'stale' | 'ghosting';
    score: number;
    indicators: { label: string; value: string; positive: boolean }[];
    suggestions: string[];
}

/**
 * Analyze conversation health for a match.
 */
export async function analyzeConversationHealth(matchId: string, userId: string): Promise<ConversationHealth> {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 30 }
        }
    });

    if (!match || match.messages.length === 0) {
        return {
            matchId,
            status: 'stale',
            score: 0,
            indicators: [{ label: 'Mensajes', value: '0', positive: false }],
            suggestions: ['Envía un mensaje para iniciar la conversación'],
        };
    }

    const messages = match.messages.reverse();
    const myMessages = messages.filter(m => m.senderId === userId);
    const theirMessages = messages.filter(m => m.senderId !== userId);

    const indicators: ConversationHealth['indicators'] = [];
    const suggestions: string[] = [];
    let score = 50;

    // Message balance
    const balance = myMessages.length / Math.max(1, theirMessages.length);
    if (balance > 0.8 && balance < 1.2) {
        indicators.push({ label: 'Balance', value: 'Equilibrado', positive: true });
        score += 15;
    } else if (balance > 2) {
        indicators.push({ label: 'Balance', value: 'Tú escribes más', positive: false });
        suggestions.push('Intenta hacer más preguntas para que la otra persona hable');
        score -= 10;
    } else if (balance < 0.5) {
        indicators.push({ label: 'Balance', value: 'Ellos escriben más', positive: true });
        score += 5;
    }

    // Response time
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].senderId !== messages[i - 1].senderId) {
            const diff = messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime();
            responseTimes.push(diff / (1000 * 60));
        }
    }

    const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : Infinity;

    if (avgResponseTime < 60) {
        indicators.push({ label: 'Tiempo de respuesta', value: '< 1 hora', positive: true });
        score += 15;
    } else if (avgResponseTime < 360) {
        indicators.push({ label: 'Tiempo de respuesta', value: '< 6 horas', positive: true });
        score += 10;
    } else if (avgResponseTime < 1440) {
        indicators.push({ label: 'Tiempo de respuesta', value: '< 24 horas', positive: false });
        suggestions.push('Responder más rápido mantiene el interés');
        score -= 5;
    } else {
        indicators.push({ label: 'Tiempo de respuesta', value: '> 24 horas', positive: false });
        suggestions.push('La conversación puede estar enfriándose');
        score -= 15;
    }

    // Last message recency
    const lastMessage = messages[messages.length - 1];
    const hoursSinceLastMessage = (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastMessage < 2) {
        indicators.push({ label: 'Último mensaje', value: 'Reciente', positive: true });
        score += 10;
    } else if (hoursSinceLastMessage < 24) {
        indicators.push({ label: 'Último mensaje', value: 'Hoy', positive: true });
        score += 5;
    } else if (hoursSinceLastMessage < 72) {
        indicators.push({ label: 'Último mensaje', value: 'Hace días', positive: false });
        suggestions.push('Reactiva la conversación con un tema nuevo');
        score -= 10;
    } else {
        indicators.push({ label: 'Último mensaje', value: 'Hace más de 3 días', positive: false });
        suggestions.push('La conversación parece haberse detenido');
        score -= 20;
    }

    // Message length trend
    const firstHalf = messages.slice(0, Math.floor(messages.length / 2));
    const secondHalf = messages.slice(Math.floor(messages.length / 2));
    const avgFirstHalf = firstHalf.reduce((sum, m) => sum + m.content.length, 0) / firstHalf.length;
    const avgSecondHalf = secondHalf.reduce((sum, m) => sum + m.content.length, 0) / secondHalf.length;

    if (avgSecondHalf > avgFirstHalf * 1.2) {
        indicators.push({ label: 'Profundidad', value: 'Creciente', positive: true });
        score += 10;
    } else if (avgSecondHalf < avgFirstHalf * 0.7) {
        indicators.push({ label: 'Profundidad', value: 'Disminuyendo', positive: false });
        suggestions.push('Intenta preguntas más personales para profundizar');
        score -= 5;
    }

    // Questions asked
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    const questionRatio = questionCount / messages.length;
    if (questionRatio > 0.2) {
        indicators.push({ label: 'Curiosidad', value: 'Alta', positive: true });
        score += 10;
    } else if (questionRatio < 0.05) {
        indicators.push({ label: 'Curiosidad', value: 'Baja', positive: false });
        suggestions.push('Haz más preguntas para mostrar interés');
        score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status: ConversationHealth['status'];
    if (score >= 80) status = 'thriving';
    else if (score >= 60) status = 'healthy';
    else if (score >= 40) status = 'fading';
    else if (score >= 20) status = 'stale';
    else status = 'ghosting';

    return { matchId, status, score, indicators, suggestions };
}
