/**
 * Detect conversation patterns that indicate success or failure.
 * This module provides pattern detection utilities for conversations.
 */

export interface ConversationPattern {
    type: 'success' | 'risk' | 'neutral';
    category: string;
    description: string;
    confidence: number;
}

/**
 * Analyze message content for patterns.
 */
export function analyzeMessagePatterns(messages: { senderId: string; content: string; createdAt: Date }[]): ConversationPattern[] {
    const patterns: ConversationPattern[] = [];

    if (messages.length < 3) return patterns;

    // Check for escalating depth
    const firstHalf = messages.slice(0, Math.floor(messages.length / 2));
    const secondHalf = messages.slice(Math.floor(messages.length / 2));

    const avgFirstLength = firstHalf.reduce((sum, m) => sum + m.content.length, 0) / firstHalf.length;
    const avgSecondLength = secondHalf.reduce((sum, m) => sum + m.content.length, 0) / secondHalf.length;

    if (avgSecondLength > avgFirstLength * 1.3) {
        patterns.push({
            type: 'success',
            category: 'depth',
            description: 'Los mensajes se están volviendo más profundos',
            confidence: 0.8,
        });
    }

    if (avgSecondLength < avgFirstLength * 0.6) {
        patterns.push({
            type: 'risk',
            category: 'depth',
            description: 'Los mensajes se están volviendo más cortos',
            confidence: 0.7,
        });
    }

    // Check for question frequency
    const questions = messages.filter(m => m.content.includes('?')).length;
    const questionRatio = questions / messages.length;

    if (questionRatio > 0.2) {
        patterns.push({
            type: 'success',
            category: 'engagement',
            description: 'Alta frecuencia de preguntas — buena curiosidad',
            confidence: 0.8,
        });
    }

    if (questionRatio < 0.05 && messages.length > 10) {
        patterns.push({
            type: 'risk',
            category: 'engagement',
            description: 'Pocas preguntas — puede indicar falta de interés',
            confidence: 0.6,
        });
    }

    // Check for response time acceleration
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].senderId !== messages[i - 1].senderId) {
            responseTimes.push(messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime());
        }
    }

    if (responseTimes.length >= 4) {
        const first2 = responseTimes.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const last2 = responseTimes.slice(-2).reduce((a, b) => a + b, 0) / 2;

        if (last2 < first2 * 0.5) {
            patterns.push({
                type: 'success',
                category: 'momentum',
                description: 'Responden cada vez más rápido',
                confidence: 0.85,
            });
        }

        if (last2 > first2 * 2) {
            patterns.push({
                type: 'risk',
                category: 'momentum',
                description: 'Los tiempos de respuesta se están duplicando',
                confidence: 0.75,
            });
        }
    }

    // Check for shared interests/topics
    const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
    const topicKeywords = ['música', 'cine', 'viaje', 'comida', 'deporte', 'libro', 'familia', 'trabajo', 'mascota'];
    const mentionedTopics = topicKeywords.filter(t => allContent.includes(t));

    if (mentionedTopics.length >= 3) {
        patterns.push({
            type: 'success',
            category: 'connection',
            description: `Múltiples temas compartidos: ${mentionedTopics.join(', ')}`,
            confidence: 0.7,
        });
    }

    return patterns;
}
