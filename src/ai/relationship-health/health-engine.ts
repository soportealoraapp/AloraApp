'use server';

import { prisma } from '@/lib/prisma';
import { RelationshipSnapshot } from '../relationship-timeline/timeline-engine';

export type HealthSeverity = 'healthy' | 'watch' | 'warning';

export interface HealthInsight {
    type: 'positive' | 'risk';
    category: string;
    severity: HealthSeverity;
    message: string;
    details: string;
    confidence: number;
    actionable?: boolean;
    actionLabel?: string;
}

export interface RelationshipHealthReport {
    overallHealth: number; // 0-100
    positiveSignals: HealthInsight[];
    riskSignals: HealthInsight[];
    dimensions: {
        healthyReciprocity: number;      // 0-100
        consistentCommunication: number; // 0-100
        balancedInterest: number;        // 0-100
        mutualVulnerability: number;     // 0-100
        boundaryRespect: number;         // 0-100
        emotionalSafety: number;         // 0-100
    };
    warningFlags: {
        unilateralDependence: boolean;
        responseAnxiety: boolean;
        earlyIntensity: boolean;
        constantValidation: boolean;
        emotionalManipulation: boolean;
        guiltPatterns: boolean;
        emotionalVolatility: boolean;
    };
}

// Early intensity detection: too much too soon
const EARLY_INTENSITY_PATTERNS = [
    /\balma gemela\b/i, /\bmedia naranja\b/i, /\bdestinad[oa]s\b/i,
    /\bperfect[oa] para mí\b/i, /\bnunca sentí\b/i, /\bnunca conocí\b/i,
    /\bcas?arnos\b/i, /\bjuntos para siempre\b/i,
    /\beres todo para mí\b/i, /\bte necesito\b.*\bsin ti\b/i,
];

const GUILT_PATTERNS = [
    /\bsi realmente te importara\b/i, /\bsi me quisieras\b/i,
    /\bte vas a arrepentir\b/i, /\bme vas a dejar\b/i,
    /\bme abandonas\b/i, /\bnunca estás\b/i, /\bsiempre te quejas\b/i,
    /\byo haría eso por ti\b/i, /\bdespués de todo lo que hice\b/i,
];

const EMOTIONAL_VOLATILITY = [
    /\bte odio\b/i, /\bno te soporto\b/i, /\bdéjame en paz\b/i,
    /\bno me escribas más\b/i, /\beres tóxic[oa]\b/i,
    /\bme tienes harta\b/i, /\bno puedo más contigo\b/i,
];

export async function generateHealthReport(
    matchId: string,
    snapshot?: RelationshipSnapshot,
): Promise<RelationshipHealthReport> {
    const messages = await prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, senderId: true, content: true, createdAt: true },
    });

    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { user1Id: true, user2Id: true, createdAt: true },
    });

    if (!match || messages.length < 3) {
        return emptyHealthReport();
    }

    const user1Msgs = messages.filter(m => m.senderId === match.user1Id);
    const user2Msgs = messages.filter(m => m.senderId === match.user2Id);
    const totalMessages = messages.length;

    // 1. Healthy reciprocity: even emotional sharing
    const emotionalWords = ['siento', 'pienso', 'creo', 'emociona', 'importa', 'valoro', 'quiero', 'necesito'];
    const user1Emotional = user1Msgs.filter(m =>
        emotionalWords.some(w => m.content.toLowerCase().includes(w))
    ).length;
    const user2Emotional = user2Msgs.filter(m =>
        emotionalWords.some(w => m.content.toLowerCase().includes(w))
    ).length;
    const totalEmotional = user1Emotional + user2Emotional;
    const healthyReciprocity = totalEmotional > 0
        ? Math.round((1 - Math.abs(user1Emotional - user2Emotional) / totalEmotional) * 100)
        : 50;

    // 2. Consistent communication
    const intervals: number[] = [];
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].senderId !== messages[i - 1].senderId) {
            intervals.push((messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime()) / 60000);
        }
    }
    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const intervalVariance = intervals.length > 0
        ? Math.sqrt(intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length) / Math.max(1, avgInterval)
        : 0;
    const consistentCommunication = Math.round(Math.max(0, Math.min(100, (1 - Math.min(1, intervalVariance)) * 100)));

    // 3. Balanced interest: who initiates
    const user1Initiations = user1Msgs.filter((m, i) => {
        const prev = messages[messages.indexOf(m) - 1];
        return !prev || prev.senderId !== match.user1Id;
    }).length;
    const user2Initiations = user2Msgs.filter((m, i) => {
        const prev = messages[messages.indexOf(m) - 1];
        return !prev || prev.senderId !== match.user2Id;
    }).length;
    const totalInitiations = user1Initiations + user2Initiations;
    const balancedInterest = totalInitiations > 0
        ? Math.round((1 - Math.abs(user1Initiations - user2Initiations) / totalInitiations) * 100)
        : 50;

    // 4. Mutual vulnerability
    const vulnerabilityWords = ['triste', 'asusta', 'preocupa', 'extraño', 'miedo', 'solo', 'herido', 'duele'];
    const user1Vuln = user1Msgs.filter(m =>
        vulnerabilityWords.some(w => m.content.toLowerCase().includes(w))
    ).length;
    const user2Vuln = user2Msgs.filter(m =>
        vulnerabilityWords.some(w => m.content.toLowerCase().includes(w))
    ).length;
    const totalVuln = user1Vuln + user2Vuln;
    const mutualVulnerability = totalVuln > 0 && user1Vuln > 0 && user2Vuln > 0
        ? Math.round((1 - Math.abs(user1Vuln - user2Vuln) / totalVuln) * 100)
        : totalVuln > 0 ? 30 : 0;

    // 5. Boundary respect (no coercion/harassment)
    const boundaryViolations = messages.filter(m => {
        const lc = m.content.toLowerCase();
        return /obligad[oa]|tienes que|debes|si no haces|envíame foto|no le digas/i.test(lc);
    }).length;
    const boundaryRespect = Math.round(Math.max(0, 100 - boundaryViolations * 20));

    // 6. Emotional safety (absence of toxicity)
    const toxicMessages = messages.filter(m => {
        const lc = m.content.toLowerCase();
        return /put[ao]|mierda|pendej[ao]|cabr[oó]n|imb[ée]cil|est[úu]pid[oa]/i.test(lc);
    }).length;
    const emotionalSafety = Math.round(Math.max(0, 100 - toxicMessages * 25));

    // Warning flags
    const earlyMessages = messages.slice(0, Math.min(20, messages.length));
    const earlyIntensityCount = earlyMessages.filter(m =>
        EARLY_INTENSITY_PATTERNS.some(p => p.test(m.content))
    ).length;

    const guiltCount = messages.filter(m =>
        GUILT_PATTERNS.some(p => p.test(m.content))
    ).length;

    const volatilityCount = messages.filter(m =>
        EMOTIONAL_VOLATILITY.some(p => p.test(m.content))
    ).length;

    const constantValidation = messages.filter(m => {
        const lc = m.content.toLowerCase();
        return /soy suficiente\?|te gusto\?|le gusto\?|soy atractiv[oa]\?|no te aburro\?|no me dejas\?/i.test(lc);
    }).length > 2;

    const unilateralDependence = healthyReciprocity < 30 && totalMessages > 10;

    const responseAnxiety = intervals.length > 0
        ? intervals.filter(i => i < 1).length > intervals.length * 0.4 && intervals.filter(i => i > 60).length > 0
        : false;

    const emotionalManipulation = messages.filter(m => {
        const lc = m.content.toLowerCase();
        return /eres el único|nadie me entiende|tú eres mi razón|sin ti no puedo|me haces sentir|por tu culpa/i.test(lc);
    }).length > 1;

    const warningFlags = {
        unilateralDependence,
        responseAnxiety,
        earlyIntensity: earlyIntensityCount > 2 && totalMessages < 30,
        constantValidation,
        emotionalManipulation,
        guiltPatterns: guiltCount > 2,
        emotionalVolatility: volatilityCount > 2,
    };

    // Build insights
    const positiveSignals: HealthInsight[] = [];
    const riskSignals: HealthInsight[] = [];

    if (healthyReciprocity >= 60) {
        positiveSignals.push({
            type: 'positive', category: 'reciprocidad', severity: 'healthy',
            message: 'Hay reciprocidad saludable', details: 'Ambos comparten sus pensamientos y emociones de manera equilibrada.',
            confidence: 0.8,
        });
    }

    if (consistentCommunication >= 60) {
        positiveSignals.push({
            type: 'positive', category: 'comunicación', severity: 'healthy',
            message: 'La comunicación es constante', details: 'Mantienen un flujo de conversación regular, lo que ayuda a construir confianza.',
            confidence: 0.75,
        });
    }

    if (mutualVulnerability >= 50) {
        positiveSignals.push({
            type: 'positive', category: 'vulnerabilidad', severity: 'healthy',
            message: 'Ambos se sienten seguros para ser vulnerables', details: 'Compartir cosas personales es una señal de confianza y seguridad emocional.',
            confidence: 0.7,
        });
    }

    if (boundaryRespect >= 90) {
        positiveSignals.push({
            type: 'positive', category: 'límites', severity: 'healthy',
            message: 'Se respetan los límites mutuamente', details: 'No hay presión ni coerción en la comunicación.',
            confidence: 0.9,
        });
    }

    // Risk insights
    if (unilateralDependence) {
        riskSignals.push({
            type: 'risk', category: 'dependencia', severity: 'warning',
            message: 'Dependencia unilateral detectada',
            details: 'Una persona está poniendo mucho más esfuerzo emocional que la otra. Las relaciones saludables son equilibradas.',
            confidence: 0.75,
            actionable: true,
            actionLabel: 'Ver consejos',
        });
    }

    if (responseAnxiety) {
        riskSignals.push({
            type: 'risk', category: 'ansiedad', severity: 'watch',
            message: 'Patrón de ansiedad por respuesta',
            details: 'Hay momentos de respuestas muy rápidas seguidas de largos silencios. Es normal tener ritmos diferentes.',
            confidence: 0.6,
        });
    }

    if (warningFlags.earlyIntensity) {
        riskSignals.push({
            type: 'risk', category: 'intensidad', severity: 'watch',
            message: 'Intensidad temprana alta',
            details: 'El uso de lenguaje muy intenso al principio puede ser una señal para tomar las cosas con calma.',
            confidence: 0.65,
        });
    }

    if (constantValidation) {
        riskSignals.push({
            type: 'risk', category: 'validación', severity: 'watch',
            message: 'Búsqueda frecuente de validación',
            details: 'Pedir reassurance constantemente puede indicar inseguridad en la conexión.',
            confidence: 0.6,
        });
    }

    if (emotionalManipulation) {
        riskSignals.push({
            type: 'risk', category: 'manipulación', severity: 'warning',
            message: 'Posible manipulación emocional',
            details: 'Frases como "nadie me entiende como tú" o "sin ti no puedo" pueden ser formas sutiles de dependencia emocional.',
            confidence: 0.7,
            actionable: true,
            actionLabel: 'Más información',
        });
    }

    if (warningFlags.guiltPatterns) {
        riskSignals.push({
            type: 'risk', category: 'culpa', severity: 'warning',
            message: 'Patrones de culpa detectados',
            details: 'Frases que generan culpa pueden ser una señal de dinámica poco saludable.',
            confidence: 0.7,
            actionable: true,
            actionLabel: 'Entender más',
        });
    }

    if (warningFlags.emotionalVolatility) {
        riskSignals.push({
            type: 'risk', category: 'volatilidad', severity: 'warning',
            message: 'Volatilidad emocional',
            details: 'Cambios bruscos de tono pueden indicar inestabilidad en la comunicación.',
            confidence: 0.75,
        });
    }

    // Overall health
    const dimensions = {
        healthyReciprocity,
        consistentCommunication,
        balancedInterest,
        mutualVulnerability,
        boundaryRespect,
        emotionalSafety,
    };

    const overallHealth = Math.round(
        Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.values(dimensions).length
    );

    return {
        overallHealth,
        positiveSignals,
        riskSignals,
        dimensions,
        warningFlags,
    };
}

function emptyHealthReport(): RelationshipHealthReport {
    return {
        overallHealth: 50,
        positiveSignals: [],
        riskSignals: [],
        dimensions: {
            healthyReciprocity: 50,
            consistentCommunication: 50,
            balancedInterest: 50,
            mutualVulnerability: 0,
            boundaryRespect: 100,
            emotionalSafety: 100,
        },
        warningFlags: {
            unilateralDependence: false,
            responseAnxiety: false,
            earlyIntensity: false,
            constantValidation: false,
            emotionalManipulation: false,
            guiltPatterns: false,
            emotionalVolatility: false,
        },
    };
}
