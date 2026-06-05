'use server';

import { prisma } from '@/lib/prisma';

export interface ConversationQualityReport {
    matchId: string;
    overall: {
        score: number;           // 0-100
        level: 'excellent' | 'good' | 'fair' | 'declining' | 'stale';
        trend: 'improving' | 'stable' | 'declining';
    };
    dimensions: {
        balance: number;         // 0-100 — who talks more
        curiosity: number;       // 0-100 — question asking
        emotionalDepth: number;  // 0-100 — vulnerability & emotion
        responseQuality: number; // 0-100 — message length & effort
        effortSymmetry: number;  // 0-100 — equal effort
        engagement: number;      // 0-100 — response speed & consistency
        reciprocity: number;     // 0-100 — mutual topic exploration
        playfulness: number;     // 0-100 — humor & light tone
    };
    metrics: {
        totalMessages: number;
        messagesPerDay: number;
        avgResponseTime: number;   // minutes
        avgMessageLength: number;  // chars
        questionRatio: number;
        initiatorRatio: number;    // 0-1 who starts
        dryResponseRatio: number;
        emojiRatio: number;
    };
    flags: {
        isDryTexting: boolean;
        isUnilateral: boolean;
        isGhostingRisk: boolean;
        isToxic: boolean;
        isSpamBehavior: boolean;
    };
    insights: QualityInsight[];
    timeline: QualityDataPoint[];
}

export interface QualityInsight {
    type: 'positive' | 'neutral' | 'warning' | 'tip';
    message: string;
    category: 'balance' | 'depth' | 'effort' | 'engagement' | 'chemistry' | 'ghosting' | 'general';
    confidence: number;
}

export interface QualityDataPoint {
    date: string;
    engagement: number;
    depth: number;
    balance: number;
}

const DRY_RESPONSES = new Set([
    'si', 'no', 'ok', 'jaja', 'jeje', 'bien', 'sip', 'nop', 'tal vez',
    'ah', 'mmm', 'sí', 'sipo', 'nopo', 'bueno', 'ya', 'dale', 'oka',
    'xd', 'lol', 'sisi', 'nono', 'sep', 'nel', 'simon', 'sale', 'va',
]);

const HIGH_EFFORT_WORDS = [
    'siento', 'pienso', 'creo', 'emociona', 'importa', 'valoro', 'quiero',
    'necesito', 'preocupa', 'feliz', 'triste', 'asusta', 'ilusiona',
    'agradezco', 'disfruto', 'sueño', 'espero', 'deseo', 'amo', 'adoro',
    'fascina', 'apasiona', 'conmueve', 'inspira', 'motiva',
];

const QUESTION_WORDS = ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'cuál', 'quién', 'quieres', 'puedes', 'sería'];

export async function analyzeConversation(
    matchId: string,
    days: number = 30,
): Promise<ConversationQualityReport> {
    const messages = await prisma.message.findMany({
        where: {
            matchId,
            createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, senderId: true, content: true, createdAt: true, type: true },
    });

    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { user1Id: true, user2Id: true },
    });

    if (!match || messages.length === 0) {
        return buildEmptyReport(matchId);
    }

    const user1Id = match.user1Id;
    const user2Id = match.user2Id;

    // Partition messages by user
    const user1Messages = messages.filter(m => m.senderId === user1Id);
    const user2Messages = messages.filter(m => m.senderId === user2Id);

    const totalMessages = messages.length;
    const daysDiff = Math.max(1, (messages[messages.length - 1].createdAt.getTime() - messages[0].createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const messagesPerDay = totalMessages / daysDiff;

    // Balance: how evenly split
    const balanceRatio = user1Messages.length > 0 && user2Messages.length > 0
        ? 1 - Math.abs(user1Messages.length - user2Messages.length) / (user1Messages.length + user2Messages.length)
        : 0;
    const balance = Math.round(balanceRatio * 100);

    // Curiosity: question frequency
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    const curiosity = Math.min(100, Math.round((questionCount / totalMessages) * 200));

    // Emotional depth
    const depthCount = messages.filter(m =>
        HIGH_EFFORT_WORDS.some(w => m.content.toLowerCase().includes(w))
    ).length;
    const emotionalDepth = Math.min(100, Math.round((depthCount / Math.max(1, totalMessages)) * 150));

    // Response quality: average length
    const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / totalMessages;
    const responseQuality = Math.min(100, Math.round((avgMessageLength / 200) * 100));

    // Effort symmetry
    const avgLen1 = user1Messages.length > 0
        ? user1Messages.reduce((s, m) => s + m.content.length, 0) / user1Messages.length
        : 0;
    const avgLen2 = user2Messages.length > 0
        ? user2Messages.reduce((s, m) => s + m.content.length, 0) / user2Messages.length
        : 0;
    const effortSymmetry = avgLen1 > 0 && avgLen2 > 0
        ? Math.round((1 - Math.abs(avgLen1 - avgLen2) / Math.max(avgLen1, avgLen2)) * 100)
        : 50;

    // Engagement: response time
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].senderId !== messages[i - 1].senderId) {
            const diff = (messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime()) / 60000;
            totalResponseTime += diff;
            responseCount++;
        }
    }
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 999;

    // Engagement score: lower response time = higher engagement (inverse)
    const engagement = Math.max(0, Math.min(100,
        100 - (avgResponseTime / 120) * 100
    ));

    // Reciprocity: do they explore each other's topics?
    const reciprocity = Math.round(
        (1 - Math.abs(avgLen1 - avgLen2) / Math.max(1, Math.max(avgLen1, avgLen2))) * 50 +
        balanceRatio * 50
    );

    // Playfulness: emoji and humor indicators
    const emojiCount = messages.filter(m => /\p{Emoji}/u.test(m.content)).length;
    const emojiRatio = emojiCount / totalMessages;
    const playfulness = Math.min(100, Math.round(emojiRatio * 200));

    // Dry response ratio
    const dryCount = messages.filter(m => DRY_RESPONSES.has(m.content.toLowerCase().trim())).length;
    const dryResponseRatio = dryCount / totalMessages;

    // Question ratio
    const questionRatio = questionCount / totalMessages;

    // Initiator ratio
    let initiatorCount = 0;
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].senderId !== messages[i - 1].senderId) {
            initiatorCount++;
        }
    }
    const initiatorRatio = initiatorCount > 0
        ? user1Messages.filter(m => m.senderId === user1Id).length / totalMessages
        : 0.5;

    // Flags
    const isDryTexting = dryResponseRatio > 0.35;
    const isUnilateral = balance < 30;
    const isGhostingRisk = avgResponseTime > 720 || // >12h
        (messages.length > 5 && avgResponseTime > 360); // >6h after 5+ msgs
    const isToxic = messages.some(m => {
        const lc = m.content.toLowerCase();
        return /put[ao]|mierda|pendej[ao]|cabr[oó]n|culiao|ctm|imb[ée]cil|est[úu]pid[oa]/i.test(lc);
    });
    const isSpamBehavior = messages.some(m => m.type === 'flagged');

    // Overall score
    const dimensions = {
        balance,
        curiosity,
        emotionalDepth,
        responseQuality,
        effortSymmetry,
        engagement,
        reciprocity,
        playfulness,
    };
    const overallScore = Math.round(Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.values(dimensions).length);

    let level: ConversationQualityReport['overall']['level'] = 'fair';
    if (overallScore >= 75) level = 'excellent';
    else if (overallScore >= 60) level = 'good';
    else if (overallScore >= 40) level = 'fair';
    else if (overallScore >= 25) level = 'declining';
    else level = 'stale';

    // Trend
    const trend = calculateTrend(messages);

    const metrics = {
        totalMessages,
        messagesPerDay: Math.round(messagesPerDay * 10) / 10,
        avgResponseTime,
        avgMessageLength: Math.round(avgMessageLength),
        questionRatio: Math.round(questionRatio * 100) / 100,
        initiatorRatio: Math.round(initiatorRatio * 100) / 100,
        dryResponseRatio: Math.round(dryResponseRatio * 100) / 100,
        emojiRatio: Math.round(emojiRatio * 100) / 100,
    };

    const flags = { isDryTexting, isUnilateral, isGhostingRisk, isToxic, isSpamBehavior };

    // Insights
    const insights = generateQualityInsights(dimensions, metrics, flags, totalMessages);

    // Timeline
    const timeline = buildTimeline(messages);

    return {
        matchId,
        overall: { score: overallScore, level, trend },
        dimensions,
        metrics,
        flags,
        insights,
        timeline,
    };
}

function buildEmptyReport(matchId: string): ConversationQualityReport {
    return {
        matchId,
        overall: { score: 0, level: 'stale', trend: 'stable' },
        dimensions: { balance: 0, curiosity: 0, emotionalDepth: 0, responseQuality: 0, effortSymmetry: 0, engagement: 0, reciprocity: 0, playfulness: 0 },
        metrics: { totalMessages: 0, messagesPerDay: 0, avgResponseTime: 0, avgMessageLength: 0, questionRatio: 0, initiatorRatio: 0.5, dryResponseRatio: 0, emojiRatio: 0 },
        flags: { isDryTexting: false, isUnilateral: false, isGhostingRisk: false, isToxic: false, isSpamBehavior: false },
        insights: [{
            type: 'neutral',
            message: 'Aún no hay suficientes mensajes para analizar. ¡El primer mensaje puede ser el más importante!',
            category: 'general',
            confidence: 1,
        }],
        timeline: [],
    };
}

function calculateTrend(messages: { content: string; createdAt: Date; senderId: string }[]): 'improving' | 'stable' | 'declining' {
    if (messages.length < 6) return 'stable';

    const half = Math.floor(messages.length / 2);
    const firstHalf = messages.slice(0, half);
    const secondHalf = messages.slice(half);

    const firstAvgLen = firstHalf.reduce((s, m) => s + m.content.length, 0) / firstHalf.length;
    const secondAvgLen = secondHalf.reduce((s, m) => s + m.content.length, 0) / secondHalf.length;

    const firstDry = firstHalf.filter(m => DRY_RESPONSES.has(m.content.toLowerCase().trim())).length / firstHalf.length;
    const secondDry = secondHalf.filter(m => DRY_RESPONSES.has(m.content.toLowerCase().trim())).length / secondHalf.length;

    let score = 0;
    if (secondAvgLen > firstAvgLen * 1.2) score += 1;
    else if (secondAvgLen < firstAvgLen * 0.7) score -= 1;

    if (secondDry < firstDry * 0.7) score += 1;
    else if (secondDry > firstDry * 1.3) score -= 1;

    if (score > 0) return 'improving';
    if (score < 0) return 'declining';
    return 'stable';
}

function buildTimeline(messages: { content: string; createdAt: Date; senderId: string }[]): QualityDataPoint[] {
    if (messages.length === 0) return [];

    // Group by day
    const dayMap = new Map<string, { engagement: number[]; depth: number[]; balance: number[] }>();

    for (const msg of messages) {
        const day = msg.createdAt.toISOString().slice(0, 10);
        if (!dayMap.has(day)) dayMap.set(day, { engagement: [], depth: [], balance: [] });

        const entry = dayMap.get(day)!;
        entry.engagement.push(msg.content.length > 20 ? 1 : msg.content.length > 5 ? 0.5 : 0);
        entry.depth.push(HIGH_EFFORT_WORDS.some(w => msg.content.toLowerCase().includes(w)) ? 1 : 0);
    }

    const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    return days.map(([date, data]) => ({
        date,
        engagement: Math.round((data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length) * 100),
        depth: Math.round((data.depth.reduce((a, b) => a + b, 0) / data.depth.length) * 100),
        balance: 50, // approximate
    }));
}

function generateQualityInsights(
    dims: ConversationQualityReport['dimensions'],
    metrics: ConversationQualityReport['metrics'],
    flags: ConversationQualityReport['flags'],
    totalMessages: number,
): QualityInsight[] {
    const insights: QualityInsight[] = [];

    if (dims.balance >= 70 && totalMessages >= 6) {
        insights.push({ type: 'positive', message: 'Ambos participan por igual en la conversación', category: 'balance', confidence: 0.85 });
    } else if (dims.balance < 35 && totalMessages >= 6) {
        insights.push({ type: 'warning', message: 'La conversación es unilateral. Una persona está poniendo más esfuerzo.', category: 'balance', confidence: 0.8 });
        insights.push({ type: 'tip', message: 'Intenta hacer preguntas abiertas para equilibrar la conversación', category: 'balance', confidence: 0.7 });
    }

    if (dims.curiosity >= 60) {
        insights.push({ type: 'positive', message: 'Hay curiosidad mutua. Se hacen preguntas con interés.', category: 'depth', confidence: 0.8 });
    } else if (dims.curiosity < 25 && totalMessages >= 6) {
        insights.push({ type: 'tip', message: 'Hacer preguntas demuestra interés genuino. ¿Qué te gustaría saber de la otra persona?', category: 'depth', confidence: 0.75 });
    }

    if (dims.emotionalDepth >= 50) {
        insights.push({ type: 'positive', message: 'Están compartiendo experiencias personales y emociones', category: 'depth', confidence: 0.8 });
    }

    if (dims.responseQuality >= 70) {
        insights.push({ type: 'positive', message: 'Ambos se toman el tiempo para escribir mensajes elaborados', category: 'effort', confidence: 0.75 });
    } else if (dims.responseQuality < 35) {
        insights.push({ type: 'warning', message: 'Los mensajes son muy cortos. Podría indicar falta de interés o prisa.', category: 'effort', confidence: 0.7 });
    }

    if (flags.isDryTexting && totalMessages >= 8) {
        insights.push({ type: 'warning', message: 'La conversación se volvió seca. Respuestas muy cortas o monosilábicas.', category: 'engagement', confidence: 0.8 });
        insights.push({ type: 'tip', message: 'Cambiar de tema o hacer una pregunta inesperada puede reactivar la conversación', category: 'engagement', confidence: 0.7 });
    }

    if (dims.engagement >= 60) {
        insights.push({ type: 'positive', message: 'Buena energía en la conversación. Responden con fluidez.', category: 'engagement', confidence: 0.75 });
    } else if (metrics.avgResponseTime > 360 && totalMessages >= 4) {
        insights.push({ type: 'neutral', message: 'Los tiempos de respuesta son largos. Cada quien tiene su ritmo.', category: 'engagement', confidence: 0.65 });
    }

    if (dims.playfulness >= 50) {
        insights.push({ type: 'positive', message: 'Hay buen sentido del humor y complicidad', category: 'chemistry', confidence: 0.7 });
    }

    if (flags.isGhostingRisk && totalMessages >= 4) {
        insights.push({ type: 'warning', message: 'Riesgo de pérdida de ritmo. Podría ser buen momento para un mensaje cálido.', category: 'ghosting', confidence: 0.7 });
    }

    if (dims.reciprocity >= 70) {
        insights.push({ type: 'positive', message: 'Ambos exploran los temas del otro con interés mutuo', category: 'chemistry', confidence: 0.75 });
    }

    if (totalMessages >= 15 && flags.isGhostingRisk === false && dims.engagement >= 50) {
        insights.push({ type: 'positive', message: `Llevan ${totalMessages} mensajes de buena conversación. ¡Sigan así!`, category: 'chemistry', confidence: 0.8 });
    }

    return insights.slice(0, 6);
}
