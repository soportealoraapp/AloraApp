'use server';

import { prisma } from '@/lib/prisma';

export interface RelationshipSnapshot {
    id: string;
    matchId: string;
    emotionalDepth: number;
    reciprocity: number;
    consistency: number;
    responseBalance: number;
    conflictRisk: number;
    attachmentTrend: number;
    chemistryScore: number;
    vulnerabilityScore: number;
    engagementLevel: number;
    generatedAt: Date;
}

export interface TimelineNarrative {
    snapshot: RelationshipSnapshot;
    previousSnapshot: RelationshipSnapshot | null;
    trends: {
        emotionalDepth: 'improving' | 'stable' | 'declining';
        reciprocity: 'improving' | 'stable' | 'declining';
        consistency: 'improving' | 'stable' | 'declining';
        chemistry: 'improving' | 'stable' | 'declining';
        vulnerability: 'improving' | 'stable' | 'declining';
    };
    narrative: string;
    flags: {
        conversationHeatingUp: boolean;
        conversationCoolingDown: boolean;
        unbalancedIntensity: boolean;
        onePursuing: boolean;
        gradualDisappearance: boolean;
        stableRelationship: boolean;
        growingMutualInterest: boolean;
        emotionalStability: number; // 0-1
    };
}

const HIGH_EFFORT_WORDS = new Set([
    'siento', 'pienso', 'creo', 'emociona', 'importa', 'valoro', 'quiero',
    'necesito', 'preocupa', 'feliz', 'triste', 'asusta', 'ilusiona',
    'agradezco', 'disfruto', 'sueño', 'espero', 'deseo', 'amo', 'adoro',
    'fascina', 'apasiona', 'conmueve', 'inspira', 'motiva',
    'confío', 'respeto', 'admiro', 'extraño', 'añoro',
]);

const DRY_RESPONSES = new Set([
    'si', 'no', 'ok', 'jaja', 'jeje', 'bien', 'sip', 'nop', 'tal vez',
    'ah', 'mmm', 'sí', 'sipo', 'nopo', 'bueno', 'ya', 'dale', 'oka',
]);

export async function generateSnapshot(matchId: string): Promise<RelationshipSnapshot> {
    const messages = await prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, senderId: true, content: true, createdAt: true },
    });

    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { user1Id: true, user2Id: true, createdAt: true },
    });

    if (!match || messages.length === 0) {
        return createBaselineSnapshot(matchId, match?.createdAt || new Date());
    }

    const user1Msgs = messages.filter(m => m.senderId === match.user1Id);
    const user2Msgs = messages.filter(m => m.senderId === match.user2Id);

    // Emotional depth: messages with vulnerable/emotional words
    const emotionalMessages = messages.filter(m =>
        HIGH_EFFORT_WORDS.has(m.content.toLowerCase().split(' ')[0]) ||
        [...HIGH_EFFORT_WORDS].some(w => m.content.toLowerCase().includes(w))
    );
    const emotionalDepth = Math.min(1, emotionalMessages.length / Math.max(1, messages.length) * 3);

    // Reciprocity: how evenly both share emotional content
    const user1Emotional = user1Msgs.filter(m =>
        [...HIGH_EFFORT_WORDS].some(w => m.content.toLowerCase().includes(w))
    ).length;
    const user2Emotional = user2Msgs.filter(m =>
        [...HIGH_EFFORT_WORDS].some(w => m.content.toLowerCase().includes(w))
    ).length;
    const totalEmotional = user1Emotional + user2Emotional;
    const reciprocity = totalEmotional > 0
        ? 1 - Math.abs(user1Emotional - user2Emotional) / totalEmotional
        : 0.5;

    // Consistency: regular message flow vs bursty
    const messageTimes = messages.map(m => m.createdAt.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < messageTimes.length; i++) {
        intervals.push(messageTimes[i] - messageTimes[i - 1]);
    }
    const avgInterval = intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : 0;
    const intervalVariance = intervals.length > 0
        ? Math.sqrt(intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length) / avgInterval
        : 0;
    const consistency = Math.max(0, Math.min(1, 1 - intervalVariance));

    // Response balance: do they take turns?
    const turnCount = messages.filter((m, i) =>
        i > 0 && m.senderId !== messages[i - 1].senderId
    ).length;
    const responseBalance = messages.length > 1 ? turnCount / (messages.length - 1) : 0.5;

    // Conflict risk: negative sentiment + toxic patterns
    const toxicMessages = messages.filter(m => {
        const lc = m.content.toLowerCase();
        return /put[ao]|mierda|pendej[ao]|cabr[oó]n|imb[ée]cil/i.test(lc);
    }).length;
    const conflictRisk = Math.min(1, toxicMessages / Math.max(1, messages.length) * 5);

    // Attachment trend: is the other person pulling away?
    const recentMessages = messages.slice(-Math.min(20, messages.length));
    const recentUser2 = recentMessages.filter(m => m.senderId === match.user2Id).length;
    const totalRecent = recentMessages.length;
    const attachmentTrend = totalRecent > 0
        ? recentUser2 / totalRecent
        : 0.5;

    // Chemistry score: questions + humor + positive sentiment
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    const humorIndicators = ['jaja', 'jeje', '😂', '😅', '😄', 'lol'];
    const humorCount = messages.filter(m =>
        humorIndicators.some(h => m.content.toLowerCase().includes(h))
    ).length;
    const chemistryScore = Math.min(1,
        (questionCount / Math.max(1, messages.length)) * 0.5 +
        (humorCount / Math.max(1, messages.length)) * 0.5
    ) * 2;

    // Vulnerability score: personal sharing
    const vulnerableTopics = ['siento', 'triste', 'asusta', 'preocupa', 'extraño', 'necesito ayuda', 'me duele', 'tengo miedo'];
    const vulnerableMessages = messages.filter(m =>
        vulnerableTopics.some(t => m.content.toLowerCase().includes(t))
    ).length;
    const vulnerabilityScore = Math.min(1, vulnerableMessages / Math.max(1, messages.length) * 4);

    // Engagement level: response speed
    const now = Date.now();
    const lastMsgTime = messages[messages.length - 1].createdAt.getTime();
    const hoursSinceLast = (now - lastMsgTime) / (1000 * 60 * 60);
    const engagementLevel = Math.max(0, Math.min(1,
        1 - (messages.length > 10 ? hoursSinceLast / 72 : hoursSinceLast / 168)
    ));

    const snapshot = {
        id: '',
        matchId,
        emotionalDepth: Math.round(emotionalDepth * 100) / 100,
        reciprocity: Math.round(reciprocity * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        responseBalance: Math.round(responseBalance * 100) / 100,
        conflictRisk: Math.round(conflictRisk * 100) / 100,
        attachmentTrend: Math.round(attachmentTrend * 100) / 100,
        chemistryScore: Math.round(Math.min(1, chemistryScore) * 100) / 100,
        vulnerabilityScore: Math.round(Math.min(1, vulnerabilityScore) * 100) / 100,
        engagementLevel: Math.round(engagementLevel * 100) / 100,
        generatedAt: new Date(),
    };

    return snapshot;
}

function createBaselineSnapshot(matchId: string, createdAt: Date): RelationshipSnapshot {
    return {
        id: '',
        matchId,
        emotionalDepth: 0,
        reciprocity: 0.5,
        consistency: 0,
        responseBalance: 0.5,
        conflictRisk: 0,
        attachmentTrend: 0.5,
        chemistryScore: 0,
        vulnerabilityScore: 0,
        engagementLevel: 0,
        generatedAt: new Date(),
    };
}

export async function persistSnapshot(matchId: string): Promise<RelationshipSnapshot> {
    const snapshot = await generateSnapshot(matchId);

    const saved = await prisma.relationshipSnapshot.create({
        data: {
            matchId,
            emotionalDepth: snapshot.emotionalDepth,
            reciprocity: snapshot.reciprocity,
            consistency: snapshot.consistency,
            responseBalance: snapshot.responseBalance,
            conflictRisk: snapshot.conflictRisk,
            attachmentTrend: snapshot.attachmentTrend,
            chemistryScore: snapshot.chemistryScore,
            vulnerabilityScore: snapshot.vulnerabilityScore,
            engagementLevel: snapshot.engagementLevel,
        },
    });

    return {
        ...snapshot,
        id: saved.id,
    };
}

export async function getSnapshots(matchId: string, limit: number = 20): Promise<RelationshipSnapshot[]> {
    const snapshots = await prisma.relationshipSnapshot.findMany({
        where: { matchId },
        orderBy: { generatedAt: 'desc' },
        take: limit,
    });

    return snapshots.map(s => ({
        id: s.id,
        matchId: s.matchId,
        emotionalDepth: s.emotionalDepth,
        reciprocity: s.reciprocity,
        consistency: s.consistency,
        responseBalance: s.responseBalance,
        conflictRisk: s.conflictRisk,
        attachmentTrend: s.attachmentTrend,
        chemistryScore: s.chemistryScore,
        vulnerabilityScore: s.vulnerabilityScore,
        engagementLevel: s.engagementLevel,
        generatedAt: s.generatedAt,
    }));
}

export function generateNarrative(
    current: RelationshipSnapshot,
    previous: RelationshipSnapshot | null,
): TimelineNarrative {
    const trends = {
        emotionalDepth: getTrend(current.emotionalDepth, previous?.emotionalDepth),
        reciprocity: getTrend(current.reciprocity, previous?.reciprocity),
        consistency: getTrend(current.consistency, previous?.consistency),
        chemistry: getTrend(current.chemistryScore, previous?.chemistryScore),
        vulnerability: getTrend(current.vulnerabilityScore, previous?.vulnerabilityScore),
    };

    const flags = {
        conversationHeatingUp: trends.emotionalDepth === 'improving' && trends.chemistry === 'improving',
        conversationCoolingDown: trends.emotionalDepth === 'declining' && trends.chemistry === 'declining',
        unbalancedIntensity: Math.abs(current.responseBalance - 0.5) > 0.3,
        onePursuing: current.responseBalance < 0.3 || current.responseBalance > 0.7,
        gradualDisappearance: trends.consistency === 'declining' && trends.reciprocity === 'declining' && current.engagementLevel < 0.4,
        stableRelationship: Object.values(trends).filter(t => t === 'stable').length >= 3 && current.emotionalDepth > 0.4,
        growingMutualInterest: trends.reciprocity === 'improving' && trends.vulnerability === 'improving' && trends.chemistry === 'improving',
        emotionalStability: Math.round(
            (1 - current.conflictRisk) * 0.3 +
            current.consistency * 0.3 +
            current.reciprocity * 0.4
        ),
    };

    const narrative = buildNarrativeText(current, previous, trends, flags);

    return {
        snapshot: current,
        previousSnapshot: previous,
        trends,
        narrative,
        flags,
    };
}

function getTrend(current: number, previous: number | undefined): 'improving' | 'stable' | 'declining' {
    if (previous === undefined) return 'stable';
    const diff = current - previous;
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
}

function buildNarrativeText(
    current: RelationshipSnapshot,
    previous: RelationshipSnapshot | null,
    trends: TimelineNarrative['trends'],
    flags: TimelineNarrative['flags'],
): string {
    const parts: string[] = [];

    if (flags.growingMutualInterest && current.emotionalDepth > 0.5) {
        parts.push('La conexión entre ustedes se está profundizando. Ambos están compartiendo más y el interés es mutuo.');
    } else if (flags.conversationHeatingUp) {
        parts.push('La conversación tiene buena energía y la química entre ustedes está creciendo.');
    } else if (flags.stableRelationship) {
        parts.push('La relación se siente estable y equilibrada. Hay una base de confianza mutua.');
    }

    if (flags.gradualDisappearance) {
        parts.push('La comunicación se ha vuelto menos frecuente. A veces un descanso es natural, pero si sientes que algo cambió, está bien preguntar.');
    } else if (flags.conversationCoolingDown && current.emotionalDepth > 0.2) {
        parts.push('La intensidad ha disminuido un poco, pero la conexión emocional que han construido sigue presente.');
    }

    if (flags.unbalancedIntensity && !flags.gradualDisappearance) {
        if (flags.onePursuing) {
            parts.push('Una persona está tomando más la iniciativa. Las relaciones más saludables suelen ser equilibradas.');
        } else {
            parts.push('Los niveles de energía son diferentes en este momento. Ambos tienen su propio ritmo.');
        }
    }

    if (trends.vulnerability === 'improving' && current.vulnerabilityScore > 0.3) {
        parts.push('Se están sintiendo más cómodos compartiendo cosas personales, lo que fortalece la confianza.');
    }

    if (trends.consistency === 'improving') {
        parts.push('La comunicación se ha vuelto más constante, lo que ayuda a construir una base sólida.');
    }

    if (current.chemistryScore > 0.6 && !parts.some(p => p.includes('química'))) {
        parts.push('Hay buena química entre ustedes. Las conversaciones fluyen con naturalidad.');
    }

    if (current.emotionalDepth > 0.6 && current.vulnerabilityScore > 0.4) {
        parts.push('Están construyendo una conexión emocional significativa. Eso requiere valentía de ambas partes.');
    }

    if (parts.length === 0) {
        if (current.engagementLevel > 0.5) {
            parts.push('La conversación sigue su curso. Cada interacción suma para conocerse mejor.');
        } else {
            parts.push('Toda conexión tiene sus ritmos. Lo importante es que ambos se sientan cómodos.');
        }
    }

    return parts.join(' ');
}

export async function shouldGenerateSnapshot(matchId: string): Promise<boolean> {
    const lastSnapshot = await prisma.relationshipSnapshot.findFirst({
        where: { matchId },
        orderBy: { generatedAt: 'desc' },
    });

    const messageCount = await prisma.message.count({ where: { matchId } });

    if (!lastSnapshot) return messageCount >= 10;

    const hoursSinceLast = (Date.now() - lastSnapshot.generatedAt.getTime()) / (1000 * 60 * 60);
    const messagesSinceLast = lastSnapshot
        ? await prisma.message.count({
            where: {
                matchId,
                createdAt: { gte: lastSnapshot.generatedAt },
            },
        })
        : messageCount;

    return messagesSinceLast >= 100 || hoursSinceLast >= 24;
}

export async function checkAndGenerateSnapshots(userId: string): Promise<number> {
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            isActive: true,
            messages: { some: {} },
        },
        select: { id: true, _count: { select: { messages: true } } },
    });

    let generated = 0;
    for (const match of matches) {
        if (await shouldGenerateSnapshot(match.id)) {
            await persistSnapshot(match.id);
            generated++;
        }
    }

    return generated;
}
