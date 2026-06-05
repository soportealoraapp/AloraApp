'use server';

import { prisma } from '@/lib/prisma';
import { Message } from '@/lib/domain/types';
import { ContentFilterService } from './content-filter';

export interface CopilotMessage {
    id: string;
    senderId: string;
    content: string;
    createdAt: Date;
}

export interface ConversationContext {
    matchId: string;
    messages: CopilotMessage[];
    user1Id: string;
    user2Id: string;
    matchCreatedAt: Date;
}

export interface GhostingAnalysis {
    probability: number; // 0-1
    severity: 'none' | 'low' | 'medium' | 'high';
    signals: string[];
    daysSinceLastMessage: number | null;
    responseDropDetected: boolean;
    unilateralConversation: boolean;
    unmatchRisk: number; // 0-1
}

export interface EmotionalInsight {
    type: 'positive' | 'neutral' | 'warning' | 'milestone';
    message: string;
    details: string;
    confidence: number;
}

export interface ConversationQuality {
    balance: number; // 0-1 (1 = perfectly balanced)
    curiosity: number; // 0-1
    emotionalDepth: number; // 0-1
    effortSymmetry: number; // 0-1
    responseQuality: number; // 0-1
    overallHealth: number; // 0-1
    isDryTexting: boolean;
    isToxic: boolean;
}

export interface SuggestedReply {
    text: string;
    context: string;
    confidence: number;
    tone: 'warm' | 'playful' | 'thoughtful' | 'direct';
    timing: 'now' | 'later' | 'tomorrow';
}

export interface CopilotInsight {
    id: string;
    matchId: string;
    timestamp: Date;
    type: 'momentum' | 'ghosting_risk' | 'quality' | 'suggestion' | 'emotional' | 'milestone';
    severity: 'info' | 'subtle' | 'notice' | 'important';
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
    data?: Record<string, any>;
}

const BAD_WORD_PATTERNS = [
    /\b(put[ao]|mierda|pendej[ao]|cabr[oó]n|culiao|ctm|conchetumadre|hij[ao] de puta)\b/i,
    /\b(odio|muérete|mátate|tonta|tarado|imbécil)\b/i,
];

const SCAM_PATTERNS = [
    /\b(transferencia|wester.?union|money.?gram|bitcoin|crypto|inversión|gana dinero|hazte rico)\b/i,
    /\b(mi tío|mi papá|mi abogado|herencia|premio|loteria)\b/i,
    /\b(envíame|mándame|deposita|préstame|necesito \$|me urge)\b/i,
];

const LOVE_BOMBING_PATTERNS = [
    /\b(alma gemela|media naranja|destinados|perfect[oá] para mí|nunca sentí)\b/i,
    /\b(cas?arte|casémonos|huyamos|juntos para siempre)\b/i,
    /\b(te amo|te adoro) en la primera conversación/i,
];

const DRY_RESPONSES = [
    'si', 'no', 'ok', 'jaja', 'jeje', 'bien', 'sip', 'nop', 'tal vez',
    'ah', 'mmm', 'sí', 'sipo', 'nopo', 'bueno', 'ya', 'dale', 'oka',
];

const POSITIVE_SIGNALS = ['?', '!', 'jaja', 'jeje', 'interesante', 'claro', 'genial', 'perfecto'];

export function getGhostingStatus(
    lastMessageAt: Date | null,
    messageCount: number,
    messages: CopilotMessage[],
    currentUserId: string,
): GhostingAnalysis {
    if (!lastMessageAt || messageCount === 0) {
        return {
            probability: 0,
            severity: 'none',
            signals: [],
            daysSinceLastMessage: null,
            responseDropDetected: false,
            unilateralConversation: false,
            unmatchRisk: 0,
        };
    }

    const now = new Date();
    const hoursSinceLastMessage = (now.getTime() - lastMessageAt.getTime()) / (1000 * 60 * 60);
    const daysSinceLastMessage = hoursSinceLastMessage / 24;

    const signals: string[] = [];
    let probability = 0;
    let responseDropDetected = false;
    let unilateralConversation = false;

    // Quick check: if only sent and no reply at all (first message unanswered)
    const otherUserId = messages.find(m => m.senderId !== currentUserId)?.senderId;
    const userMessages = messages.filter(m => m.senderId === currentUserId);
    const otherMessages = messages.filter(m => m.senderId !== currentUserId);

    if (userMessages.length > 0 && otherMessages.length === 0) {
        signals.push('Mensaje inicial sin respuesta');
        probability += 0.3;
        unilateralConversation = true;
    }

    // Response drop: if the ratio of other's messages in the last 1/3 of conversation is lower
    if (messages.length >= 6) {
        const recentThird = Math.floor(messages.length / 3);
        const recentMessages = messages.slice(-recentThird);
        const recentOther = recentMessages.filter(m => m.senderId !== currentUserId).length;
        const recentUser = recentMessages.length - recentOther;

        if (recentOther === 0 && recentUser > 2) {
            signals.push('La otra persona dejó de responder');
            responseDropDetected = true;
            probability += 0.4;
        } else if (recentOther < Math.floor(recentMessages.length * 0.3)) {
            signals.push('La conversación se volvió unilateral');
            unilateralConversation = true;
            probability += 0.2;
        }
    }

    // Time-based signals
    if (hoursSinceLastMessage > 72) {
        signals.push('Más de 3 días sin respuesta');
        probability += 0.3;
    } else if (hoursSinceLastMessage > 24) {
        signals.push('Más de 24 horas sin respuesta');
        probability += 0.15;
    } else if (hoursSinceLastMessage > 6) {
        signals.push('Más de 6 horas sin actividad');
        probability += 0.05;
    }

    // Dry response detection
    const lastFewOther = messages
        .filter(m => m.senderId !== currentUserId)
        .slice(-3);
    const dryOtherCount = lastFewOther.filter(m => {
        const text = m.content.toLowerCase().trim();
        return DRY_RESPONSES.includes(text) || text.length < 5;
    }).length;

    if (lastFewOther.length >= 2 && dryOtherCount >= 2) {
        signals.push('Respuestas muy cortas o secas');
        probability += 0.2;
    }

    // Tone shift detection
    if (messages.length >= 10) {
        const firstHalf = messages.slice(0, Math.floor(messages.length / 2));
        const secondHalf = messages.slice(Math.floor(messages.length / 2));

        const otherFirstHalf = firstHalf.filter(m => m.senderId !== currentUserId);
        const otherSecondHalf = secondHalf.filter(m => m.senderId !== currentUserId);

        const avgLengthFirstHalf = otherFirstHalf.reduce((sum, m) => sum + m.content.length, 0) / Math.max(1, otherFirstHalf.length);
        const avgLengthSecondHalf = otherSecondHalf.reduce((sum, m) => sum + m.content.length, 0) / Math.max(1, otherSecondHalf.length);

        if (avgLengthSecondHalf < avgLengthFirstHalf * 0.5 && avgLengthFirstHalf > 20) {
            signals.push('Disminución notable en la longitud de respuestas');
            probability += 0.15;
        }
    }

    // Severity
    let severity: GhostingAnalysis['severity'] = 'none';
    if (probability >= 0.6) severity = 'high';
    else if (probability >= 0.4) severity = 'medium';
    else if (probability >= 0.15) severity = 'low';

    // Unmatch risk
    const unmatchRisk = Math.min(1, probability + (responseDropDetected ? 0.2 : 0) + (unilateralConversation ? 0.1 : 0));

    return {
        probability: Math.min(1, probability),
        severity,
        signals,
        daysSinceLastMessage: hoursSinceLastMessage > 1 ? Math.round(daysSinceLastMessage * 10) / 10 : null,
        responseDropDetected,
        unilateralConversation,
        unmatchRisk: Math.min(1, unmatchRisk),
    };
}

export function analyzeConversationQuality(messages: CopilotMessage[]): ConversationQuality {
    if (messages.length < 2) {
        return {
            balance: 0.5,
            curiosity: 0,
            emotionalDepth: 0,
            effortSymmetry: 0.5,
            responseQuality: 0,
            overallHealth: 0.3,
            isDryTexting: false,
            isToxic: false,
        };
    }

    // Count messages per user
    const userCounts = new Map<string, number>();
    for (const m of messages) {
        userCounts.set(m.senderId, (userCounts.get(m.senderId) || 0) + 1);
    }
    const counts = Array.from(userCounts.values());
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const balance = counts.length === 2 ? 1 - (maxCount - minCount) / (maxCount + minCount) : 0.5;

    // Curiosity: count questions
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    const curiosity = Math.min(1, questionCount / Math.max(1, messages.length) * 3);

    // Emotional depth: words associated with emotions
    const depthWords = ['siento', 'pienso', 'creo', 'emociona', 'importa', 'valoro', 'quiero', 'necesito', 'preocupa', 'feliz', 'triste', 'asusta', 'ilusiona', 'agradezco', 'disfruto'];
    const depthCount = messages.filter(m => depthWords.some(w => m.content.toLowerCase().includes(w))).length;
    const emotionalDepth = Math.min(1, depthCount / Math.max(1, messages.length) * 2);

    // Effort symmetry: who sends longer messages
    const userAvgLength = new Map<string, number>();
    for (const [uid] of userCounts) {
        const userMsgs = messages.filter(m => m.senderId === uid);
        const avgLen = userMsgs.reduce((sum, m) => sum + m.content.length, 0) / userMsgs.length;
        userAvgLength.set(uid, avgLen);
    }
    const lengths = Array.from(userAvgLength.values());
    const effortSymmetry = lengths.length === 2
        ? 1 - Math.abs(lengths[0] - lengths[1]) / Math.max(lengths[0] + lengths[1], 1)
        : 0.5;

    // Response quality: average message length (very short = low effort)
    const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    const responseQuality = Math.min(1, avgMessageLength / 200);

    // Dry texting detection
    const dryCount = messages.filter(m => {
        const text = m.content.toLowerCase().trim();
        return DRY_RESPONSES.includes(text) || text.length < 3;
    }).length;
    const isDryTexting = dryCount / Math.max(1, messages.length) > 0.4;

    // Toxicity
    const toxicMessages = messages.filter(m =>
        BAD_WORD_PATTERNS.some(p => p.test(m.content))
    );
    const isToxic = toxicMessages.length > 0;

    // Overall health
    const healthFactors = [balance, curiosity, emotionalDepth, effortSymmetry, responseQuality];
    const overallHealth = healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length;

    return {
        balance,
        curiosity,
        emotionalDepth,
        effortSymmetry,
        responseQuality,
        overallHealth,
        isDryTexting,
        isToxic,
    };
}

export function detectScamPatterns(messages: CopilotMessage[]): { detected: boolean; patterns: string[]; risk: number } {
    const patterns: string[] = [];
    let score = 0;

    for (const m of messages) {
        for (const p of SCAM_PATTERNS) {
            if (p.test(m.content)) {
                patterns.push(`Patrón detectado en mensaje: "${m.content.substring(0, 60)}..."`);
                score += 0.25;
            }
        }
        for (const p of LOVE_BOMBING_PATTERNS) {
            if (p.test(m.content) && messages.length < 20) {
                patterns.push(`Love bombing detectado en mensaje temprano`);
                score += 0.3;
            }
        }
    }

    return {
        detected: score >= 0.3,
        patterns,
        risk: Math.min(1, score),
    };
}

export function generateInsights(
    quality: ConversationQuality,
    ghosting: GhostingAnalysis,
    messageCount: number,
): EmotionalInsight[] {
    const insights: EmotionalInsight[] = [];

    // Health-based insights
    if (quality.overallHealth >= 0.7 && messageCount >= 4) {
        insights.push({
            type: 'positive',
            message: 'Buena química',
            details: 'La conversación fluye naturalmente. Ambos participan con interés.',
            confidence: Math.min(0.9, quality.overallHealth),
        });
    } else if (quality.overallHealth >= 0.5 && messageCount >= 6) {
        insights.push({
            type: 'neutral',
            message: 'La conversación es agradable',
            details: 'Sigue explorando temas para mantener el interés mutuo.',
            confidence: 0.6,
        });
    }

    if (quality.isDryTexting) {
        insights.push({
            type: 'warning',
            message: 'La conversación perdió ritmo',
            details: 'Las respuestas se volvieron muy cortas. Un tema nuevo o una pregunta profunda podrían reactivarla.',
            confidence: 0.75,
        });
    }

    if (quality.curiosity >= 0.5) {
        insights.push({
            type: 'positive',
            message: 'Curiosidad mutua',
            details: 'Ambos se hacen preguntas. Es una señal de interés genuino.',
            confidence: Math.min(0.85, quality.curiosity),
        });
    }

    if (ghosting.severity === 'high' || ghosting.severity === 'medium') {
        insights.push({
            type: 'warning',
            message: ghosting.severity === 'high' ? 'Riesgo de ghosting alto' : 'Posible pérdida de interés',
            details: ghosting.signals.slice(0, 2).join('. '),
            confidence: ghosting.probability,
        });
    }

    if (quality.emotionalDepth >= 0.4) {
        insights.push({
            type: 'positive',
            message: 'Conexión emocional',
            details: 'Están compartiendo sentimientos y experiencias personales. Buena señal de confianza.',
            confidence: Math.min(0.8, quality.emotionalDepth),
        });
    }

    if (messageCount >= 20 && quality.overallHealth >= 0.6) {
        insights.push({
            type: 'milestone',
            message: `${messageCount} mensajes intercambiados`,
            details: 'Llevan una conversación extensa y de calidad. ¿Es hora de conocerlos en persona?',
            confidence: 0.7,
        });
    }

    if (quality.balance < 0.4 && messageCount >= 6) {
        insights.push({
            type: 'warning',
            message: 'Conversación unilateral',
            details: 'Una persona está poniendo mucho más esfuerzo. Intenta hacer preguntas abiertas.',
            confidence: 0.7,
        });
    }

    return insights;
}

export function generateSuggestedReplies(
    lastMessages: CopilotMessage[],
    profile: { displayName?: string; interests: string[] },
    quality: ConversationQuality,
): SuggestedReply[] {
    const suggestions: SuggestedReply[] = [];
    const lastMsg = lastMessages[lastMessages.length - 1];
    if (!lastMsg) return [];

    const lowerContent = lastMsg.content.toLowerCase();
    const isQuestion = lastMsg.content.includes('?');
    const isDry = DRY_RESPONSES.includes(lowerContent.trim());
    const isShort = lastMsg.content.length < 15;

    // If the last message was a question, help answer meaningfully
    if (isQuestion) {
        suggestions.push({
            text: `Qué buena pregunta! ${generateThoughtfulResponse(profile.interests)}`,
            context: 'Responder con apertura',
            confidence: 0.7,
            tone: 'thoughtful',
            timing: 'now',
        });
        suggestions.push({
            text: 'Nunca me lo habían preguntado así. Déjame pensar... creo que ',
            context: 'Respuesta honesta',
            confidence: 0.6,
            tone: 'thoughtful',
            timing: 'now',
        });
    }

    // If conversation is dry, suggest a playful change of topic
    if (quality.isDryTexting || (isDry && isShort)) {
        suggestions.push({
            text: 'Bueno, cambiemos de tema. ¿Cuál es la cosa más interesante que te ha pasado esta semana?',
            context: 'Cambiar tema',
            confidence: 0.8,
            tone: 'playful',
            timing: 'now',
        });
        if (profile.interests.length > 0) {
            const interest = profile.interests[Math.floor(Math.random() * profile.interests.length)];
            suggestions.push({
                text: `Hablando de temas más divertidos... ¿qué es lo que más te gusta de ${interest}?`,
                context: `Tocar tema: ${interest}`,
                confidence: 0.75,
                tone: 'warm',
                timing: 'now',
            });
        }
    }

    // If conversation has good momentum, suggest deepening
    if (quality.overallHealth >= 0.6 && messageCount(lastMessages) >= 6) {
        suggestions.push({
            text: 'Me gusta cómo fluye la conversación. ¿Qué es lo que más valoras en una conexión?',
            context: 'Profundizar',
            confidence: 0.7,
            tone: 'thoughtful',
            timing: 'now',
        });
    }

    // Emotional check-in
    if (messageCount(lastMessages) >= 10) {
        suggestions.push({
            text: 'Por cierto, ¿cómo estás tú hoy? Más allá de lo conversado.',
            context: 'Check-in emocional',
            confidence: 0.65,
            tone: 'warm',
            timing: 'now',
        });
    }

    // Playful option always
    suggestions.push({
        text: 'Pregunta importante: ¿café o té? Esto define personalidades.',
        context: 'Juego ligero',
        confidence: 0.6,
        tone: 'playful',
        timing: 'now',
    });

    return suggestions.slice(0, 4);
}

function messageCount(messages: CopilotMessage[]): number {
    return messages.length;
}

function generateThoughtfulResponse(interests: string[]): string {
    const templates = [
        'me hace pensar en cuánto valoro las conversaciones auténticas',
        'me encanta cuando alguien se toma el tiempo de preguntar cosas con profundidad',
        'creo que dice mucho de una persona el tipo de preguntas que hace',
        'justo estaba reflexionando sobre eso el otro día',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

export async function getCopilotInsights(
    matchId: string,
    currentUserId: string,
): Promise<{
    quality: ConversationQuality;
    ghosting: GhostingAnalysis;
    scam: { detected: boolean; patterns: string[]; risk: number };
    insights: EmotionalInsight[];
    suggestions: SuggestedReply[];
}> {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                select: { id: true, senderId: true, content: true, createdAt: true },
            },
            user1: { include: { profile: true } },
            user2: { include: { profile: true } },
        },
    });

    if (!match) throw new Error('Match not found');

    const messages: CopilotMessage[] = match.messages;
    const lastMessageAt = messages.length > 0 ? messages[messages.length - 1].createdAt : null;

    const profile = match.user1Id === currentUserId
        ? match.user2.profile
        : match.user1.profile;

    const quality = analyzeConversationQuality(messages);
    const ghosting = getGhostingStatus(lastMessageAt, messages.length, messages, currentUserId);
    const scam = detectScamPatterns(messages);
    const insights = generateInsights(quality, ghosting, messages.length);
    const suggestions = generateSuggestedReplies(messages, {
        displayName: profile?.displayName || undefined,
        interests: profile?.interests || [],
    }, quality);

    return { quality, ghosting, scam, insights, suggestions };
}

export async function getAllMatchInsights(
    userId: string,
): Promise<CopilotInsight[]> {
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            isActive: true,
        },
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, senderId: true, content: true, createdAt: true },
            },
            _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });

    const insights: CopilotInsight[] = [];

    for (const match of matches) {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const msgCount = match._count.messages;

        if (msgCount === 0) continue;

        // Get full messages for deeper analysis
        const allMessages = await prisma.message.findMany({
            where: { matchId: match.id },
            orderBy: { createdAt: 'asc' },
            select: { id: true, senderId: true, content: true, createdAt: true },
        });

        const copilotMessages: CopilotMessage[] = allMessages;
        const lastMessageAt = copilotMessages.length > 0 ? copilotMessages[copilotMessages.length - 1].createdAt : null;

        const quality = analyzeConversationQuality(copilotMessages);
        const ghosting = getGhostingStatus(lastMessageAt, copilotMessages.length, copilotMessages, userId);
        const generated = generateInsights(quality, ghosting, copilotMessages.length);

        // Create actionable insights
        for (const gi of generated.slice(0, 2)) {
            insights.push({
                id: `insight_${match.id}_${gi.type}`,
                matchId: match.id,
                timestamp: new Date(),
                type: gi.type === 'positive' ? 'momentum' : gi.type === 'warning' ? 'ghosting_risk' : 'emotional',
                severity: gi.type === 'warning' ? 'notice' : 'info',
                title: gi.message,
                message: gi.details,
                actionLabel: gi.type === 'warning' && msgCount > 0 ? 'Ir al chat' : undefined,
                actionUrl: gi.type === 'warning' ? `/chat/${match.id}` : undefined,
                data: { quality: quality.overallHealth, ghosting: ghosting.probability },
            });
        }

        // Ghosting insight
        if (ghosting.severity !== 'none') {
            insights.push({
                id: `ghost_${match.id}`,
                matchId: match.id,
                timestamp: new Date(),
                type: 'ghosting_risk',
                severity: ghosting.severity === 'high' ? 'important' : 'subtle',
                title: ghosting.severity === 'high' ? 'Alto riesgo de ghosting' : 'Posible pérdida de ritmo',
                message: ghosting.signals[0] || 'La conversación perdió dinámica.',
                actionLabel: 'Intentar reactivar',
                actionUrl: `/chat/${match.id}`,
                data: { probability: ghosting.probability, signals: ghosting.signals },
            });
        }
    }

    return insights;
}
