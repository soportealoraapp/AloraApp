import { prisma } from '@/lib/prisma';

export interface ConversationSuccessScore {
    score: number;
    engagement: number;
    reciprocity: number;
    depth: number;
    momentum: number;
    patterns: { type: 'positive' | 'negative'; description: string }[];
}

/**
 * Calculate conversation success score for a match.
 */
export async function calculateConversationSuccess(matchId: string): Promise<ConversationSuccessScore> {
    const messages = await prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
        select: {
            senderId: true, content: true, createdAt: true, type: true,
        }
    });

    if (messages.length < 2) {
        return {
            score: 0, engagement: 0, reciprocity: 0, depth: 0, momentum: 0,
            patterns: [{ type: 'negative', description: 'Conversación muy nueva' }],
        };
    }

    const patterns: ConversationSuccessScore['patterns'] = [];

    // 1. Engagement: message count relative to time span
    const timeSpanHours = (messages[messages.length - 1].createdAt.getTime() - messages[0].createdAt.getTime()) / (1000 * 60 * 60);
    const messagesPerHour = timeSpanHours > 0 ? messages.length / timeSpanHours : messages.length;
    const engagement = Math.min(100, messagesPerHour * 20 + messages.length * 2);

    if (messages.length > 20) {
        patterns.push({ type: 'positive', description: 'Conversación activa con muchos mensajes' });
    } else if (messages.length < 5) {
        patterns.push({ type: 'negative', description: 'Pocos mensajes intercambiados' });
    }

    // 2. Reciprocity: balance between users
    const senderCounts = new Map<string, number>();
    messages.forEach(m => senderCounts.set(m.senderId, (senderCounts.get(m.senderId) || 0) + 1));
    const counts = Array.from(senderCounts.values());
    const reciprocity = counts.length === 2
        ? Math.min(100, (1 - Math.abs(counts[0] - counts[1]) / messages.length) * 100)
        : 50;

    if (reciprocity > 80) {
        patterns.push({ type: 'positive', description: 'Excelente equilibrio en la conversación' });
    } else if (reciprocity < 40) {
        patterns.push({ type: 'negative', description: 'Un lado escribe mucho más que el otro' });
    }

    // 3. Depth: message length and question ratio
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    const questionRatio = questionCount / messages.length;
    const depth = Math.min(100, (avgLength / 5) + (questionRatio * 200));

    if (avgLength > 80) {
        patterns.push({ type: 'positive', description: 'Mensajes detallados y profundos' });
    } else if (avgLength < 20) {
        patterns.push({ type: 'negative', description: 'Mensajes muy cortos' });
    }

    if (questionRatio > 0.15) {
        patterns.push({ type: 'positive', description: 'Buena frecuencia de preguntas' });
    }

    // 4. Momentum: response time trend
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].senderId !== messages[i - 1].senderId) {
            responseTimes.push(messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime());
        }
    }

    let momentum = 50;
    if (responseTimes.length >= 2) {
        const firstHalf = responseTimes.slice(0, Math.floor(responseTimes.length / 2));
        const secondHalf = responseTimes.slice(Math.floor(responseTimes.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (avgSecond < avgFirst * 0.7) {
            momentum = 80;
            patterns.push({ type: 'positive', description: 'Los tiempos de respuesta están mejorando' });
        } else if (avgSecond > avgFirst * 1.5) {
            momentum = 30;
            patterns.push({ type: 'negative', description: 'Los tiempos de respuesta están aumentando' });
        } else {
            momentum = 60;
        }
    }

    // Composite score
    const score = Math.round(engagement * 0.3 + reciprocity * 0.25 + depth * 0.25 + momentum * 0.2);

    return { score, engagement: Math.round(engagement), reciprocity: Math.round(reciprocity), depth: Math.round(depth), momentum: Math.round(momentum), patterns };
}

/**
 * Detect conversation patterns that indicate success or failure.
 */
export async function detectConversationPatterns(matchId: string): Promise<{
    successPatterns: string[];
    riskPatterns: string[];
    suggestions: string[];
}> {
    const successPatterns: string[] = [];
    const riskPatterns: string[] = [];
    const suggestions: string[] = [];

    const messages = await prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
        select: { senderId: true, content: true, createdAt: true },
    });

    if (messages.length < 3) return { successPatterns, riskPatterns, suggestions };

    // Check for shared topics (common words)
    const words = messages.flatMap(m => m.content.toLowerCase().split(/\s+/));
    const wordFreq = new Map<string, number>();
    words.forEach(w => { if (w.length > 4) wordFreq.set(w, (wordFreq.get(w) || 0) + 1); });
    const sharedTopics = [...wordFreq.entries()].filter(([, count]) => count >= 2).map(([word]) => word);

    if (sharedTopics.length > 0) {
        successPatterns.push(`Temas compartidos: ${sharedTopics.slice(0, 3).join(', ')}`);
    }

    // Check for escalating intimacy
    const intimateWords = ['encanta', 'gusta', 'bonito', 'hermoso', 'especial', 'conecto', 'comparto'];
    const intimateCount = messages.filter(m =>
        intimateWords.some(w => m.content.toLowerCase().includes(w))
    ).length;

    if (intimateCount > 2) {
        successPatterns.push('La conversación está profundizando');
    }

    // Check for question-response pattern
    let questionsAnswered = 0;
    for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].content.includes('?') && messages[i].senderId !== messages[i + 1].senderId) {
            questionsAnswered++;
        }
    }

    if (questionsAnswered > 3) {
        successPatterns.push('Las preguntas están siendo respondidas');
    }

    // Risk: monologue
    const last5 = messages.slice(-5);
    const last5Senders = last5.map(m => m.senderId);
    if (new Set(last5Senders).size === 1 && last5.length >= 5) {
        riskPatterns.push('Un solo usuario escribió los últimos 5 mensajes');
        suggestions.push('Intenta hacer una pregunta para equilibrar la conversación');
    }

    // Risk: very short responses
    const last3AvgLength = messages.slice(-3).reduce((sum, m) => sum + m.content.length, 0) / 3;
    if (last3AvgLength < 15 && messages.length > 5) {
        riskPatterns.push('Las respuestas se están acortando');
        suggestions.push('Intenta un tema nuevo o más personal');
    }

    return { successPatterns, riskPatterns, suggestions };
}
