'use server';

import { prisma } from '@/lib/prisma';

// ========== LOVE LANGUAGE INFERENCE ==========

const LOVE_LANGUAGE_PATTERNS = [
    {
        language: 'words_of_affirmation',
        patterns: [/\bte veo bien\b/i, /\bte ves\b.*\bhermos[oa]\b/i, /\bme encanta\b.*\btu\b/i, /\beres\b.*\bincre[íi]ble\b/i, /\bgracias por\b/i, /\baprecio\b/i, /\bvaloro\b.*\bte\b/i, /\bme gusta\b.*\bde ti\b/i],
        keywords: ['gracias', 'aprecio', 'valoro', 'hermoso', 'increíble', 'especial', 'importas'],
    },
    {
        language: 'quality_time',
        patterns: [/\bcontigo\b/i, /\bpasar tiempo\b/i, /\bjuntos\b/i, /\bcompartir\b/i, /\bhagamos\b/i, /\bplaneemos\b/i, /\bme encanta estar\b/i],
        keywords: ['contigo', 'juntos', 'tiempo', 'compartir', 'planes', 'experiencia'],
    },
    {
        language: 'physical_touch',
        patterns: [/\babrazo\b/i, /\bbeso\b/i, /\bcariño\b/i, /\btomar\b.*\bmano\b/i, /\babrazar\b/i, /\bcontacto\b/i],
        keywords: ['abrazo', 'beso', 'cariño', 'tacto'],
    },
    {
        language: 'acts_of_service',
        patterns: [/\bte ayudo\b/i, /\bhago\b.*\bpor ti\b/i, /\bte prepar[ée]\b/i, /\bte cocin[oe]\b/i, /\bte traigo\b/i, /\bte cuido\b/i, /\bte apoyo\b/i],
        keywords: ['ayudo', 'preparar', 'cocinar', 'cuidar', 'apoyar', 'hacer'],
    },
    {
        language: 'receiving_gifts',
        patterns: [/\bte compr[ée]\b/i, /\bte traje\b/i, /\bregalo\b/i, /\bsorpresa\b/i, /\bdetalle\b/i, /\bten\b.*\bpara ti\b/i],
        keywords: ['regalo', 'sorpresa', 'detalle', 'comprar', 'traje'],
    },
];

const CONFLICT_STYLE_PATTERNS = [
    {
        style: 'collaborative',
        patterns: [/\bentiendo\b/i, /\bpodemos\b/i, /\bsolución\b/i, /\bhablemos\b/i, /\barreglemos\b/i, /\bencuentra\b/i, /\blleguemos a un acuerdo\b/i],
    },
    {
        style: 'avoidant',
        patterns: [/\bdespu[ée]s\b/i, /\bno quiero pelear\b/i, /\bmejor no\b/i, /\bdéjalo\b/i, /\bolv[íi]dalo\b/i, /\bno importa\b/i],
    },
    {
        style: 'confrontational',
        patterns: [/\bsiempre tú\b/i, /\bpor tu culpa\b/i, /\bnunca\b.*\bescuchas\b/i, /\bsi no fuera por ti\b/i, /\btú tienes la culpa\b/i],
    },
    {
        style: 'accommodating',
        patterns: [/\bcomo t[úu] quieras\b/i, /\bpor ti lo que sea\b/i, /\bno pasa nada\b/i, /\best[áa] bien, no importa\b/i, /\btienes razón\b/i],
    },
];

const OPENNESS_PATTERNS = {
    high: [/quiero conocerte/i, /cuéntame/i, /comparte/i, /qué piensas/i, /cómo te sientes/i, /qué sueñas/i, /qué miedos/i],
    medium: [/me gusta hablar/i, /interesante/i, /cuéntame más/i, /me da curiosidad/i],
    low: [/no sé/i, /normal/i, /igual/i, /da igual/i, /no mucho/i],
};

const INTENSITY_PATTERNS = {
    high: [/te amo/i, /te adoro/i, /apasiona/i, /intenso/i, /urgente/i, /necesito verte/i, /no puedo sin ti/i],
    medium: [/me gustas/i, /me encantas/i, /quiero verte/i, /emociona/i],
    low: [/me caes bien/i, /está bien/i, /tranqui/i, /sin prisa/i, /poco a poco/i],
};

export interface AdaptiveMemoryProfile {
    userId: string;
    loveLanguage: {
        primary: string | null;
        secondary: string | null;
        confidence: number;
    };
    conflictStyle: string | null;
    opennessLevel: 'high' | 'medium' | 'low' | null;
    toleratedIntensity: 'high' | 'medium' | 'low' | null;
    responseRhythm: {
        preferredPace: 'fast' | 'moderate' | 'slow' | null;
        typicalHours: string[];
        consistency: number;
    };
    emotionalStyle: {
        depthPreference: 'deep' | 'balanced' | 'light' | null;
        humorFrequency: number;
        vulnerability: number;
    };
    deepVsLightPreference: 'deep' | 'balanced' | 'light' | null;
}

export async function inferAdaptiveMemory(userId: string): Promise<AdaptiveMemoryProfile> {
    const messages = await prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { content: true, createdAt: true },
    });

    const allText = messages.map(m => m.content).join(' ');

    // Love language inference
    const languageScores = new Map<string, number>();
    for (const ll of LOVE_LANGUAGE_PATTERNS) {
        let score = 0;
        for (const p of ll.patterns) {
            const matches = (allText.match(p) || []).length;
            score += matches * 2;
        }
        for (const kw of ll.keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            const matches = (allText.match(regex) || []).length;
            score += matches;
        }
        languageScores.set(ll.language, score);
    }

    const sortedLanguages = [...languageScores.entries()].sort((a, b) => b[1] - a[1]);
    const totalLangScore = sortedLanguages.reduce((s, [, v]) => s + v, 0);
    const primaryLang = sortedLanguages[0]?.[1] > 0 ? sortedLanguages[0][0] : null;
    const secondaryLang = sortedLanguages[1]?.[1] > 0 ? sortedLanguages[1][0] : null;
    const langConfidence = totalLangScore > 0
        ? Math.min(1, (sortedLanguages[0]?.[1] || 0) / totalLangScore)
        : 0;

    // Conflict style inference
    const conflictScores = CONFLICT_STYLE_PATTERNS.map(cs => ({
        style: cs.style,
        count: cs.patterns.reduce((sum, p) => sum + (allText.match(p) || []).length, 0),
    }));
    conflictScores.sort((a, b) => b.count - a.count);
    const conflictStyle = conflictScores[0]?.count > 0 ? conflictScores[0].style : null;

    // Openness level
    const opennessHigh = countPatterns(allText, OPENNESS_PATTERNS.high);
    const opennessMed = countPatterns(allText, OPENNESS_PATTERNS.medium);
    const opennessLow = countPatterns(allText, OPENNESS_PATTERNS.low);
    const opennessLevel: 'high' | 'medium' | 'low' | null =
        opennessHigh > opennessMed && opennessHigh > opennessLow ? 'high' :
        opennessMed > opennessLow ? 'medium' :
        opennessLow > 0 ? 'low' : null;

    // Intensity tolerance
    const intensityHigh = countPatterns(allText, INTENSITY_PATTERNS.high);
    const intensityMed = countPatterns(allText, INTENSITY_PATTERNS.medium);
    const intensityLow = countPatterns(allText, INTENSITY_PATTERNS.low);
    const toleratedIntensity: 'high' | 'medium' | 'low' | null =
        intensityHigh > intensityMed && intensityHigh > intensityLow ? 'high' :
        intensityMed > intensityLow ? 'medium' :
        intensityLow > 0 ? 'low' : null;

    // Response rhythm
    const hourBuckets = new Map<string, number>();
    for (const m of messages) {
        const hour = m.createdAt.getHours().toString().padStart(2, '0');
        hourBuckets.set(hour, (hourBuckets.get(hour) || 0) + 1);
    }
    const sortedHours = [...hourBuckets.entries()].sort((a, b) => b[1] - a[1]);
    const peakHours = sortedHours.slice(0, 3).map(([h]) => `${h}:00`);

    const messageTimes = messages.map(m => m.createdAt.getTime()).sort((a, b) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < messageTimes.length; i++) {
        intervals.push((messageTimes[i] - messageTimes[i - 1]) / 60000);
    }
    const avgInterval = intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : 120;
    const preferredPace = avgInterval < 30 ? 'fast' : avgInterval < 120 ? 'moderate' : 'slow';
    const intervalVariance = intervals.length > 0
        ? Math.sqrt(intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length) / Math.max(1, avgInterval)
        : 1;
    const consistency = Math.max(0, Math.min(1, 1 - Math.min(1, intervalVariance)));

    // Emotional style
    const deepWords = ['siento', 'pienso', 'creo', 'emociona', 'valoro', 'quiero', 'necesito', 'sueño', 'espero', 'deseo'];
    const humorWords = ['jaja', 'jeje', '😂', '😅', '😄', 'lol', 'xd'];
    const vulnWords = ['triste', 'asusta', 'preocupa', 'extraño', 'miedo', 'solo', 'herido', 'duele'];

    const deepCount = messages.filter(m => deepWords.some(w => m.content.toLowerCase().includes(w))).length;
    const humorCount = messages.filter(m => humorWords.some(w => m.content.toLowerCase().includes(w))).length;
    const vulnCount = messages.filter(m => vulnWords.some(w => m.content.toLowerCase().includes(w))).length;

    const totalMsgs = messages.length;
    const deepRatio = totalMsgs > 0 ? deepCount / totalMsgs : 0;
    const depthPreference = deepRatio > 0.2 ? 'deep' : deepRatio > 0.05 ? 'balanced' : 'light';

    const deepVsLightPreference = depthPreference;

    const memory: AdaptiveMemoryProfile = {
        userId,
        loveLanguage: {
            primary: primaryLang,
            secondary: secondaryLang,
            confidence: langConfidence,
        },
        conflictStyle,
        opennessLevel,
        toleratedIntensity,
        responseRhythm: {
            preferredPace,
            typicalHours: peakHours,
            consistency: Math.round(consistency * 100) / 100,
        },
        emotionalStyle: {
            depthPreference,
            humorFrequency: totalMsgs > 0 ? humorCount / totalMsgs : 0,
            vulnerability: totalMsgs > 0 ? vulnCount / totalMsgs : 0,
        },
        deepVsLightPreference,
    };

    // Persist to UserMemory
    if (primaryLang || conflictStyle || opennessLevel || toleratedIntensity) {
        await prisma.userMemory.upsert({
            where: { userId },
            update: {
                loveLanguage: JSON.stringify({
                    primary: primaryLang,
                    secondary: secondaryLang,
                    confidence: langConfidence,
                }),
                conflictStyle: conflictStyle,
                opennessLevel: opennessLevel,
                toleratedIntensity: toleratedIntensity,
            },
            create: {
                userId,
                enabled: true,
                loveLanguage: JSON.stringify({
                    primary: primaryLang,
                    secondary: secondaryLang,
                    confidence: langConfidence,
                }),
                conflictStyle: conflictStyle,
                opennessLevel: opennessLevel,
                toleratedIntensity: toleratedIntensity,
            },
        });
    }

    return memory;
}

function countPatterns(text: string, patterns: RegExp[]): number {
    return patterns.reduce((sum, p) => sum + (text.match(p) || []).length, 0);
}

export async function getAdaptiveMemory(userId: string): Promise<AdaptiveMemoryProfile | null> {
    const memory = await prisma.userMemory.findUnique({ where: { userId } });
    if (!memory || !memory.enabled) return null;

    const loveLanguage = memory.loveLanguage ? JSON.parse(memory.loveLanguage) : null;

    // Infer from messages if persisted memory is incomplete
    const messages = await prisma.message.count({ where: { senderId: userId } });
    if (messages < 20) {
        return {
            userId,
            loveLanguage: loveLanguage || { primary: null, secondary: null, confidence: 0 },
            conflictStyle: memory.conflictStyle || null,
            opennessLevel: memory.opennessLevel as any || null,
            toleratedIntensity: memory.toleratedIntensity as any || null,
            responseRhythm: { preferredPace: null, typicalHours: [], consistency: 0 },
            emotionalStyle: { depthPreference: 'balanced', humorFrequency: 0, vulnerability: 0 },
            deepVsLightPreference: 'balanced',
        };
    }

    return await inferAdaptiveMemory(userId);
}

export async function explainMemory(userId: string): Promise<{ label: string; value: string; source: string }[]> {
    const memory = await getAdaptiveMemory(userId);
    if (!memory) return [];

    const explanations: { label: string; value: string; source: string }[] = [];

    if (memory.loveLanguage.primary) {
        const labels: Record<string, string> = {
            words_of_affirmation: 'Palabras de afirmación',
            quality_time: 'Tiempo de calidad',
            physical_touch: 'Contacto físico',
            acts_of_service: 'Actos de servicio',
            receiving_gifts: 'Recibir regalos',
        };
        explanations.push({
            label: 'Lenguaje de amor',
            value: labels[memory.loveLanguage.primary] || memory.loveLanguage.primary,
            source: 'Basado en patrones de comunicación',
        });
    }

    if (memory.conflictStyle) {
        const labels: Record<string, string> = {
            collaborative: 'Colaborativo',
            avoidant: 'Evitativo',
            confrontational: 'Confrontativo',
            accommodating: 'Complaciente',
        };
        explanations.push({
            label: 'Estilo de conflicto',
            value: labels[memory.conflictStyle] || memory.conflictStyle,
            source: 'Inferido de cómo manejas desacuerdos',
        });
    }

    if (memory.opennessLevel) {
        const descriptions: Record<string, string> = {
            high: 'Abierta a conversaciones profundas',
            medium: 'Disfruta tanto lo profundo como lo ligero',
            low: 'Prefiere conversaciones ligeras al inicio',
        };
        explanations.push({
            label: 'Apertura emocional',
            value: descriptions[memory.opennessLevel],
            source: 'Observado en tus conversaciones',
        });
    }

    if (memory.responseRhythm.preferredPace) {
        const paces: Record<string, string> = {
            fast: 'Responde con rapidez, disfruta conversaciones fluidas',
            moderate: 'Ritmo equilibrado, sin presión',
            slow: 'Prefiere tomarse su tiempo para responder',
        };
        explanations.push({
            label: 'Ritmo de respuesta',
            value: paces[memory.responseRhythm.preferredPace],
            source: 'Basado en tu historial de mensajes',
        });
    }

    if (memory.emotionalStyle.depthPreference) {
        const depths: Record<string, string> = {
            deep: 'Disfruta conversaciones con profundidad emocional',
            balanced: 'Disfruta equilibrio entre temas profundos y ligeros',
            light: 'Prefiere mantener las conversaciones ligeras',
        };
        explanations.push({
            label: 'Estilo conversacional',
            value: depths[memory.emotionalStyle.depthPreference],
            source: 'Observado en tus interacciones',
        });
    }

    return explanations;
}
