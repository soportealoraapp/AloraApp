'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';

// ========== EXISTING MODELS (would be in Prisma schema) ==========

interface CommunicationStyle {
    type: 'direct' | 'thoughtful' | 'playful' | 'reserved';
    openness: number;      // 0-1
    expressiveness: number; // 0-1
    listening: number;      // 0-1
}

interface AttachmentStyle {
    style: 'secure' | 'anxious' | 'avoidant' | 'fearful-avoidant';
    security: number;     // 0-1
    independence: number; // 0-1
    trust_ease: number;   // 0-1
}

interface PacingStyle {
    speed: 'slow' | 'moderate' | 'fast';
    patience: number;     // 0-1
    consistency: number;  // 0-1
    initiative: number;   // 0-1
}

interface HumorStyle {
    type: 'sarcastic' | 'wholesome' | 'dark' | 'self-deprecating' | 'playful' | 'dry';
    frequency: number;    // 0-1
    warmth: number;       // 0-1
}

interface EmotionalAvailability {
    available: number;     // 0-1
    vulnerability: number; // 0-1
    awareness: number;     // 0-1
}

interface LifestyleCompatibility {
    activeScore: number;   // 0-1
    socialScore: number;   // 0-1
    routineMatch: number;  // 0-1
    valuesAlign: number;   // 0-1
}

interface ConversationChemistry {
    flow: number;          // 0-1
    reciprocity: number;   // 0-1
    ease: number;          // 0-1
    depth: number;         // 0-1
}

interface BehaviorMetrics {
    responseRate: number;       // 0-1
    avgResponseTime: number;    // minutes
    messageLength: number;      // chars
    initiativeRatio: number;    // 0-1 (who starts convos)
    questionFrequency: number;  // 0-1
}

export interface CompatibilityV2Result {
    totalScore: number;          // 0-100
    dimensionScores: {
        interests: number;          // 0-100
        values: number;             // 0-100
        attachmentStyle: number;    // 0-100
        communication: number;      // 0-100
        pacing: number;             // 0-100
        emotionalAvailability: number; // 0-100
        humor: number;              // 0-100
        lifestyle: number;          // 0-100
        conversationChemistry: number; // 0-100
        behaviorCompatibility: number;  // 0-100
    };
    explanations: string[];
    mlSignal: {
        predictedSuccess: number;    // 0-1
        ghostingRisk: number;        // 0-1
        longTermPotential: number;   // 0-1
        dataConfidence: number;      // 0-1
    };
    feedbackWeight: number;          // how much feedback data influenced score
}

interface FeedbackSample {
    liked: boolean;
    matched: boolean;
    messaged: boolean;
    replied: boolean;
    unmatched: boolean;
    blocked: boolean;
    ghosted: boolean;
    report: boolean;
}

// ========== DIMENSION SCORING ==========

function scoreInterests(interestsA: string[], interestsB: string[]): number {
    if (interestsA.length === 0 || interestsB.length === 0) return 50;

    const aLower = interestsA.map(i => i.toLowerCase());
    const bLower = interestsB.map(i => i.toLowerCase());

    const intersection = aLower.filter(i => bLower.includes(i)).length;
    const union = new Set([...aLower, ...bLower]).size;

    // Jaccard similarity
    const jaccard = union > 0 ? intersection / union : 0;

    // Boost for shared niche interests (uncommon ones matter more)
    const commonInterests = aLower.filter(i => bLower.includes(i));
    const nicheBonus = commonInterests.filter(i =>
        !['música', 'cine', 'viajes', 'comida', 'deporte', 'leer'].includes(i)
    ).length * 5;

    return Math.min(100, Math.round(jaccard * 60 + Math.min(40, nicheBonus)));
}

function scoreValues(valuesA: string[], valuesB: string[]): number {
    if (valuesA.length === 0 || valuesB.length === 0) return 50;

    const aLower = valuesA.map(v => v.toLowerCase());
    const bLower = valuesB.map(v => v.toLowerCase());

    const intersection = aLower.filter(v => bLower.includes(v)).length;
    const union = new Set([...aLower, ...bLower]).size;

    const jaccard = union > 0 ? intersection / union : 0;

    // Values alignment is critical for compatibility
    return Math.min(100, Math.round(jaccard * 85 + 15));
}

function scoreAttachmentStyle(a: AttachmentStyle, b: AttachmentStyle): number {
    // Secure + Secure = best
    // Secure + Anxious = moderate
    // Avoidant + Anxious = challenging
    // Fearful + anything = complex

    const pairKey = `${a.style}-${b.style}`;
    let baseScore = 50;

    const compatibilityMap: Record<string, number> = {
        'secure-secure': 95,
        'secure-anxious': 65,
        'secure-avoidant': 45,
        'secure-fearful-avoidant': 40,
        'anxious-secure': 65,
        'anxious-anxious': 40,
        'anxious-avoidant': 20,
        'anxious-fearful-avoidant': 25,
        'avoidant-secure': 45,
        'avoidant-anxious': 20,
        'avoidant-avoidant': 30,
        'avoidant-fearful-avoidant': 25,
        'fearful-avoidant-secure': 40,
        'fearful-avoidant-anxious': 25,
        'fearful-avoidant-avoidant': 25,
        'fearful-avoidant-fearful-avoidant': 20,
    };

    baseScore = compatibilityMap[pairKey] || 50;

    // Adjust by security score
    const avgSecurity = (a.security + b.security) / 2;
    baseScore += (avgSecurity - 0.5) * 30;

    return Math.round(Math.max(0, Math.min(100, baseScore)));
}

function scoreCommunication(a: CommunicationStyle, b: CommunicationStyle): number {
    let score = 50;

    // Same style = easier communication
    if (a.type === b.type) score += 25;

    // Complementary styles
    const complementary: Record<string, string[]> = {
        'direct': ['direct'],
        'thoughtful': ['thoughtful', 'playful'],
        'playful': ['playful', 'thoughtful'],
        'reserved': ['reserved', 'thoughtful'],
    };
    if (complementary[a.type]?.includes(b.type)) score += 10;

    // Openness alignment
    const opennessDiff = Math.abs(a.openness - b.openness);
    score += (1 - opennessDiff) * 15;

    // Expressiveness alignment
    const exprDiff = Math.abs(a.expressiveness - b.expressiveness);
    score += (1 - exprDiff) * 10;

    return Math.round(Math.max(0, Math.min(100, score)));
}

function scorePacing(a: PacingStyle, b: PacingStyle): number {
    let score = 50;

    if (a.speed === b.speed) score += 30;
    else if (
        (a.speed === 'moderate' && b.speed !== 'fast') ||
        (b.speed === 'moderate' && a.speed !== 'fast')
    ) score += 15;

    const patienceDiff = Math.abs(a.patience - b.patience);
    score += (1 - patienceDiff) * 10;

    const consistencyDiff = Math.abs(a.consistency - b.consistency);
    score += (1 - consistencyDiff) * 10;

    return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreEmotionalAvailability(a: EmotionalAvailability, b: EmotionalAvailability): number {
    const avgAvailable = (a.available + b.available) / 2;
    const avgVulnerability = (a.vulnerability + b.vulnerability) / 2;
    const avgAwareness = (a.awareness + b.awareness) / 2;

    const diffAvailable = Math.abs(a.available - b.available);
    const diffVulnerability = Math.abs(a.vulnerability - b.vulnerability);

    let score = 50;
    score += avgAvailable * 25;
    score += avgVulnerability * 15;
    score += avgAwareness * 10;
    score += (1 - diffAvailable) * 10;
    score += (1 - diffVulnerability) * 10;

    return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreHumor(a: HumorStyle, b: HumorStyle): number {
    let score = 50;

    if (a.type === b.type) score += 25;

    const warmthDiff = Math.abs(a.warmth - b.warmth);
    score += (1 - warmthDiff) * 15;

    const freqDiff = Math.abs(a.frequency - b.frequency);
    score += (1 - freqDiff) * 10;

    return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreLifestyle(a: LifestyleCompatibility, b: LifestyleCompatibility): number {
    let score = 50;

    const activeDiff = Math.abs(a.activeScore - b.activeScore);
    score += (1 - activeDiff) * 15;

    const socialDiff = Math.abs(a.socialScore - b.socialScore);
    score += (1 - socialDiff) * 10;

    const routineDiff = Math.abs(a.routineMatch - b.routineMatch);
    score += (1 - routineDiff) * 10;

    score += Math.min(a.valuesAlign, b.valuesAlign) * 15;

    return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreConversationChemistry(a: ConversationChemistry, b: ConversationChemistry): number {
    // This is based on actual conversation data, not profiles
    // When both users have conversation data, we can measure actual chemistry
    const avgFlow = (a.flow + b.flow) / 2;
    const avgReciprocity = (a.reciprocity + b.reciprocity) / 2;
    const avgEase = (a.ease + b.ease) / 2;

    let score = 50;
    score += avgFlow * 20;
    score += avgReciprocity * 20;
    score += avgEase * 10;

    return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreBehaviorCompatibility(a: BehaviorMetrics, b: BehaviorMetrics): number {
    let score = 50;

    // Response rate compatibility
    const rrDiff = Math.abs(a.responseRate - b.responseRate);
    score += (1 - rrDiff) * 20;

    // Response time compatibility (both fast = good, both slow = good, mismatch = bad)
    const rtDiff = Math.abs(a.avgResponseTime - b.avgResponseTime);
    if (rtDiff < 30) score += 15;       // Both respond in similar timeframe
    else if (rtDiff > 120) score -= 10;  // Very different response pacing

    // Initiative ratio compatibility
    const irDiff = Math.abs(a.initiativeRatio - b.initiativeRatio);
    score += (1 - irDiff) * 10;

    // Question frequency
    const qfDiff = Math.abs(a.questionFrequency - b.questionFrequency);
    score += (1 - qfDiff) * 5;

    return Math.round(Math.max(0, Math.min(100, score)));
}

// ========== FEEDBACK-BASED ML WEIGHTS ==========

async function getFeedbackWeights(
    userIdA: string,
    userIdB: string,
): Promise<{ weights: Record<string, number>; confidence: number }> {
    // Check past feedback patterns for similar profile pairs
    const profileA = await prisma.profile.findUnique({ where: { userId: userIdA } });
    const profileB = await prisma.profile.findUnique({ where: { userId: userIdB } });

    if (!profileA || !profileB) {
        return { weights: defaultWeights(), confidence: 0.1 };
    }

    // Find historical interactions with similar interest overlap
    const aInterests = profileA.interests || [];
    const bInterests = profileB.interests || [];
    const overlap = aInterests.filter(i => bInterests.some(
        bi => bi.toLowerCase() === i.toLowerCase()
    )).length;

    // Find users with similar interest overlap patterns and their outcomes
    const similarInteractions = await prisma.interaction.findMany({
        where: {
            type: { in: ['like', 'superlike', 'pass'] },
            fromUser: {
                profile: {
                    interests: { hasSome: aInterests.slice(0, 3) },
                },
            },
        },
        select: {
            type: true,
            toUserId: true,
            fromUserId: true,
        },
        take: 500,
    });

    // Calculate success rates based on interest overlap patterns
    let successCount = 0;
    let totalCount = 0;
    for (const interaction of similarInteractions) {
        if (interaction.type === 'pass') continue;
        totalCount++;

        // Check if it led to a match
        const matchExists = await prisma.match.findFirst({
            where: {
                OR: [
                    { user1Id: interaction.fromUserId, user2Id: interaction.toUserId },
                    { user1Id: interaction.toUserId, user2Id: interaction.fromUserId },
                ],
            },
        });
        if (matchExists) successCount++;
    }

    const baseSuccessRate = totalCount > 0 ? successCount / totalCount : 0.5;

    // Calculate dimension weights based on what matters most in this cohort
    const weights: Record<string, number> = {
        interests: 0.15,
        values: 0.20,
        attachmentStyle: 0.10,
        communication: 0.15,
        pacing: 0.10,
        emotionalAvailability: 0.10,
        humor: 0.05,
        lifestyle: 0.10,
        conversationChemistry: 0.05,
        behaviorCompatibility: 0.10,
    };

    // If values overlap is high and success rate is high, increase values weight
    if (overlap >= 3 && baseSuccessRate > 0.6) {
        weights.values = 0.30;
        weights.interests = 0.10;
    }

    // If there's little data, rely more on static dimensions
    const confidence = Math.min(0.5, totalCount / 1000);

    return { weights, confidence };
}

function defaultWeights(): Record<string, number> {
    return {
        interests: 0.15,
        values: 0.20,
        attachmentStyle: 0.10,
        communication: 0.15,
        pacing: 0.10,
        emotionalAvailability: 0.10,
        humor: 0.05,
        lifestyle: 0.10,
        conversationChemistry: 0.05,
        behaviorCompatibility: 0.10,
    };
}

// ========== EXPLAINABILITY ==========

function generateExplanations(
    scores: CompatibilityV2Result['dimensionScores'],
): string[] {
    const explanations: string[] = [];

    // Top strengths
    const sorted = Object.entries(scores)
        .sort(([, a], [, b]) => b - a);

    const top = sorted.slice(0, 3);
    const bottom = sorted.slice(-2);

    for (const [dim, score] of top) {
        if (score >= 70) {
            explanations.push(formatExplanation(dim, score));
        }
    }

    if (bottom[0] && bottom[0][1] < 40) {
        explanations.push(formatWeaknessExplanation(bottom[0][0], bottom[0][1]));
    }

    if (bottom[1] && bottom[1][1] < 40) {
        explanations.push(formatWeaknessExplanation(bottom[1][0], bottom[1][1]));
    }

    // Add overall assessment
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    if (avgScore >= 70) {
        explanations.push('Tienen una base sólida para construir una conexión significativa.');
    } else if (avgScore >= 50) {
        explanations.push('Hay potencial. Las diferencias pueden complementarse con comunicación.');
    } else {
        explanations.push('Pueden tener estilos de vida diferentes. A veces las diferencias crean química.');
    }

    return explanations;
}

function formatExplanation(dim: string, score: number): string {
    const map: Record<string, string> = {
        interests: `Comparten intereses afines (${score}%)`,
        values: `Sus valores fundamentales están alineados (${score}%)`,
        attachmentStyle: `Sus estilos de apego son compatibles (${score}%)`,
        communication: `Su forma de comunicarse fluye naturalmente (${score}%)`,
        pacing: `Llevan un ritmo relacional similar (${score}%)`,
        emotionalAvailability: `Ambos están en una buena disponibilidad emocional (${score}%)`,
        humor: `Su sentido del humor conecta bien (${score}%)`,
        lifestyle: `Compatibilidad en estilo de vida y rutinas (${score}%)`,
        conversationChemistry: `La química conversacional es prometedora (${score}%)`,
        behaviorCompatibility: `Sus patrones de respuesta se complementan (${score}%)`,
    };
    return map[dim] || `${dim}: ${score}%`;
}

function formatWeaknessExplanation(dim: string, score: number): string {
    const map: Record<string, string> = {
        interests: 'Tienen intereses distintos, lo que puede ser complementario o desafiante.',
        values: 'Hay diferencias en valores fundamentales que requerirán diálogo.',
        attachmentStyle: 'Sus estilos de apego pueden necesitar paciencia y comprensión mutua.',
        communication: 'Su comunicación puede requerir ajustes para fluir mejor.',
        pacing: 'Llevan ritmos diferentes. Uno puede querer ir más rápido que el otro.',
        emotionalAvailability: 'Hay diferencias en disponibilidad emocional que explorar.',
        humor: 'Su sentido del humor no está perfectamente alineado.',
        lifestyle: 'Tienen estilos de vida distintos que pueden chocar.',
        conversationChemistry: 'La química conversacional está desarrollándose.',
        behaviorCompatibility: 'Sus patrones de respuesta son diferentes.',
    };
    return map[dim] || `${dim}: necesita atención (${score}%)`;
}

// ========== ML FEEDBACK SIGNAL ==========

function calculateMLSignal(
    dimensionScores: CompatibilityV2Result['dimensionScores'],
): CompatibilityV2Result['mlSignal'] {
    const avgMain = (
        dimensionScores.values +
        dimensionScores.emotionalAvailability +
        dimensionScores.communication +
        dimensionScores.attachmentStyle
    ) / 400;

    // Predicted success based on key dimensions
    const predictedSuccess = 0.2 + avgMain * 0.8;

    // Ghosting risk (inverse of behavior + communication compatibility)
    const ghostingRisk = Math.max(0, 1 - (
        dimensionScores.behaviorCompatibility / 100 * 0.5 +
        dimensionScores.communication / 100 * 0.3 +
        dimensionScores.pacing / 100 * 0.2
    ));

    // Long-term potential (values + emotional + lifestyle)
    const longTermPotential = (
        dimensionScores.values / 100 * 0.4 +
        dimensionScores.emotionalAvailability / 100 * 0.3 +
        dimensionScores.lifestyle / 100 * 0.3
    );

    return {
        predictedSuccess: Math.round(predictedSuccess * 100) / 100,
        ghostingRisk: Math.round(Math.min(1, ghostingRisk) * 100) / 100,
        longTermPotential: Math.round(Math.min(1, longTermPotential) * 100) / 100,
        dataConfidence: 0.7,
    };
}

// ========== MAIN SCORING FUNCTION ==========

export async function getCompatibilityV2(
    userIdA: string,
    userIdB: string,
    conversationHistory?: {
        messages: { senderId: string; content: string; createdAt: Date }[];
    },
): Promise<CompatibilityV2Result> {
    const [profileA, profileB] = await Promise.all([
        prisma.profile.findUnique({ where: { userId: userIdA } }),
        prisma.profile.findUnique({ where: { userId: userIdB } }),
    ]);

    if (!profileA || !profileB) {
        throw new Error('Profiles not found');
    }

    // Extract profile-based dimensions
    const interestsA = profileA.interests || [];
    const interestsB = profileB.interests || [];
    const valuesA = profileA.values || [];
    const valuesB = profileB.values || [];

    // Infer communication/attachment/humor from profile data
    // In a real system, these would come from quizzes or analysis
    const commA = inferCommunication(profileA);
    const commB = inferCommunication(profileB);
    const attachA = inferAttachment(profileA);
    const attachB = inferAttachment(profileB);
    const paceA = inferPacing(profileA);
    const paceB = inferPacing(profileB);
    const availA = inferEmotionalAvailability(profileA);
    const availB = inferEmotionalAvailability(profileB);
    const humorA = inferHumor(profileA);
    const humorB = inferHumor(profileB);
    const lifeA = inferLifestyle(profileA);
    const lifeB = inferLifestyle(profileB);

    // Conversation-derived chemistry
    let chemA: ConversationChemistry = { flow: 0.5, reciprocity: 0.5, ease: 0.5, depth: 0.5 };
    let chemB: ConversationChemistry = { flow: 0.5, reciprocity: 0.5, ease: 0.5, depth: 0.5 };
    let behA: BehaviorMetrics = { responseRate: 0.5, avgResponseTime: 60, messageLength: 50, initiativeRatio: 0.5, questionFrequency: 0.3 };
    let behB: BehaviorMetrics = { responseRate: 0.5, avgResponseTime: 60, messageLength: 50, initiativeRatio: 0.5, questionFrequency: 0.3 };

    if (conversationHistory) {
        const derived = deriveFromConversation(conversationHistory, userIdA, userIdB);
        chemA = derived.chemA;
        chemB = derived.chemB;
        behA = derived.behA;
        behB = derived.behB;
    }

    // Calculate dimension scores
    const dimensionScores = {
        interests: scoreInterests(interestsA, interestsB),
        values: scoreValues(valuesA, valuesB),
        attachmentStyle: scoreAttachmentStyle(attachA, attachB),
        communication: scoreCommunication(commA, commB),
        pacing: scorePacing(paceA, paceB),
        emotionalAvailability: scoreEmotionalAvailability(availA, availB),
        humor: scoreHumor(humorA, humorB),
        lifestyle: scoreLifestyle(lifeA, lifeB),
        conversationChemistry: scoreConversationChemistry(chemA, chemB),
        behaviorCompatibility: scoreBehaviorCompatibility(behA, behB),
    };

    // Get ML feedback weights from observed patterns
    const { weights, confidence } = await getFeedbackWeights(userIdA, userIdB);

    // Weighted total
    let totalScore = 0;
    for (const [dim, weight] of Object.entries(weights)) {
        totalScore += (dimensionScores[dim as keyof typeof dimensionScores] || 50) * weight;
    }

    const explanations = generateExplanations(dimensionScores);
    const mlSignal = calculateMLSignal(dimensionScores);

    return {
        totalScore: Math.round(Math.max(0, Math.min(100, totalScore))),
        dimensionScores,
        explanations,
        mlSignal,
        feedbackWeight: confidence,
    };
}

// ========== INFERENCE FUNCTIONS (from profile data) ==========

function inferCommunication(profile: any): CommunicationStyle {
    const interests = (profile.interests || []) as string[];
    const bio = (profile.bio || '').toLowerCase();

    if (interests.some((i: string) => ['filosofía', 'psicología', 'escritura', 'poesía'].includes(i.toLowerCase()))) {
        return { type: 'thoughtful', openness: 0.7, expressiveness: 0.6, listening: 0.8 };
    }
    if (interests.some((i: string) => ['comedia', 'improvisación', 'humor'].includes(i.toLowerCase()))) {
        return { type: 'playful', openness: 0.8, expressiveness: 0.9, listening: 0.5 };
    }
    if (bio.includes('direct') || bio.includes('sincero') || bio.includes('claro')) {
        return { type: 'direct', openness: 0.9, expressiveness: 0.8, listening: 0.6 };
    }
    if (bio.includes('tímido') || bio.includes('reservado') || bio.includes('introvertido')) {
        return { type: 'reserved', openness: 0.3, expressiveness: 0.3, listening: 0.9 };
    }

    // Default based on bio length
    if (bio.length > 100) {
        return { type: 'thoughtful', openness: 0.6, expressiveness: 0.6, listening: 0.7 };
    }
    return { type: 'playful', openness: 0.7, expressiveness: 0.7, listening: 0.6 };
}

function inferAttachment(profile: any): AttachmentStyle {
    const bio = (profile.bio || '').toLowerCase();
    const values = (profile.values || []) as string[];

    const hasSecurity = values.some((v: string) => ['estabilidad', 'confianza', 'seguridad'].includes(v.toLowerCase()));
    const hasIndependence = values.some((v: string) => ['independencia', 'libertad', 'espacio'].includes(v.toLowerCase()));
    const hasConnection = values.some((v: string) => ['conexión', 'intimidad', 'cercanía'].includes(v.toLowerCase()));

    if (hasSecurity && !hasIndependence) {
        return { style: 'secure', security: 0.8, independence: 0.4, trust_ease: 0.8 };
    }
    if (hasConnection && hasIndependence) {
        return { style: 'fearful-avoidant', security: 0.4, independence: 0.7, trust_ease: 0.3 };
    }
    if (hasConnection) {
        return { style: 'anxious', security: 0.5, independence: 0.3, trust_ease: 0.4 };
    }
    if (hasIndependence) {
        return { style: 'avoidant', security: 0.5, independence: 0.9, trust_ease: 0.3 };
    }

    return { style: 'secure', security: 0.6, independence: 0.5, trust_ease: 0.6 };
}

function inferPacing(profile: any): PacingStyle {
    const bio = (profile.bio || '').toLowerCase();

    if (bio.includes('poco a poco') || bio.includes('sin prisas') || bio.includes('tiempo')) {
        return { speed: 'slow', patience: 0.8, consistency: 0.9, initiative: 0.3 };
    }
    if (bio.includes('aventura') || bio.includes('espontáneo') || bio.includes('vivir')) {
        return { speed: 'fast', patience: 0.3, consistency: 0.4, initiative: 0.9 };
    }
    return { speed: 'moderate', patience: 0.6, consistency: 0.6, initiative: 0.6 };
}

function inferEmotionalAvailability(profile: any): EmotionalAvailability {
    const bio = (profile.bio || '').toLowerCase();
    const photoCount = (profile.photos || []).length;

    let available = 0.5;
    let vulnerability = 0.4;
    let awareness = 0.5;

    if (bio.length > 100) { vulnerability += 0.2; awareness += 0.2; }
    if (bio.includes('busco') || bio.includes('quiero')) { awareness += 0.2; available += 0.1; }
    if (photoCount >= 3) { available += 0.2; }
    if (bio.includes('vulnerabilidad') || bio.includes('siento') || bio.includes('emociones')) { vulnerability += 0.3; }
    if (bio.includes('sanar') || bio.includes('crecer') || bio.includes('aprender')) { awareness += 0.3; }

    return {
        available: Math.min(1, available),
        vulnerability: Math.min(1, vulnerability),
        awareness: Math.min(1, awareness),
    };
}

function inferHumor(profile: any): HumorStyle {
    const interests = (profile.interests || []) as string[];
    const bio = (profile.bio || '').toLowerCase();

    if (interests.some((i: string) => ['comedia', 'stand-up', 'humor negro'].includes(i.toLowerCase()))) {
        return { type: 'dark', frequency: 0.8, warmth: 0.3 };
    }
    if (bio.includes('sarcasmo') || bio.includes('ironía')) {
        return { type: 'sarcastic', frequency: 0.7, warmth: 0.4 };
    }
    if (bio.includes('auto') && bio.includes('humor')) {
        return { type: 'self-deprecating', frequency: 0.7, warmth: 0.7 };
    }
    if (interests.some((i: string) => ['juegos', 'diversión', 'alegría'].includes(i.toLowerCase()))) {
        return { type: 'playful', frequency: 0.8, warmth: 0.9 };
    }
    return { type: 'wholesome', frequency: 0.6, warmth: 0.8 };
}

function inferLifestyle(profile: any): LifestyleCompatibility {
    const interests = (profile.interests || []) as string[];
    const values = (profile.values || []) as string[];

    const active = interests.filter((i: string) =>
        ['deporte', 'running', 'gimnasio', 'yoga', 'senderismo', 'baile'].includes(i.toLowerCase())
    ).length > 0 ? 0.8 : 0.4;

    const social = interests.filter((i: string) =>
        ['fiestas', 'bailar', 'amigos', 'viajar', 'social'].includes(i.toLowerCase())
    ).length > 0 ? 0.8 : 0.5;

    const routine = values.filter((v: string) =>
        ['rutina', 'estabilidad', 'orden', 'disciplina'].includes(v.toLowerCase())
    ).length > 0 ? 0.8 : 0.5;

    const valuesAlign = values.length > 0 ? 0.7 : 0.4;

    return { activeScore: active, socialScore: social, routineMatch: routine, valuesAlign };
}

function deriveFromConversation(
    history: { messages: { senderId: string; content: string; createdAt: Date }[] },
    userIdA: string,
    userIdB: string,
) {
    const msgs = history.messages;
    const aMsgs = msgs.filter(m => m.senderId === userIdA);
    const bMsgs = msgs.filter(m => m.senderId === userIdB);

    const chemA: ConversationChemistry = {
        flow: Math.min(1, msgs.length / 50),
        reciprocity: aMsgs.length > 0 && bMsgs.length > 0
            ? 1 - Math.abs(aMsgs.length - bMsgs.length) / (aMsgs.length + bMsgs.length)
            : 0.5,
        ease: Math.min(1, msgs.filter(m => m.content.length > 10).length / msgs.length),
        depth: Math.min(1, msgs.filter(m => m.content.length > 50).length / Math.max(1, msgs.length) * 2),
    };
    chemB = { ...chemA };

    const now = Date.now();
    const timesA = aMsgs.map(m => m.createdAt.getTime()).sort((a, b) => a - b);
    const timesB = bMsgs.map(m => m.createdAt.getTime()).sort((a, b) => a - b);

    const avgResponseA = timesA.length > 1
        ? timesA.slice(1).reduce((sum, t, i) => sum + (t - timesA[i]), 0) / (timesA.length - 1) / 60000
        : 60;
    const avgResponseB = timesB.length > 1
        ? timesB.slice(1).reduce((sum, t, i) => sum + (t - timesB[i]), 0) / (timesB.length - 1) / 60000
        : 60;

    const avgMsgLenA = aMsgs.length > 0
        ? aMsgs.reduce((s, m) => s + m.content.length, 0) / aMsgs.length
        : 50;
    const avgMsgLenB = bMsgs.length > 0
        ? bMsgs.reduce((s, m) => s + m.content.length, 0) / bMsgs.length
        : 50;

    const questionCountA = aMsgs.filter(m => m.content.includes('?')).length;
    const questionCountB = bMsgs.filter(m => m.content.includes('?')).length;

    const behA: BehaviorMetrics = {
        responseRate: bMsgs.length > 0 ? Math.min(1, aMsgs.length / bMsgs.length) : 0.3,
        avgResponseTime: Math.round(avgResponseA),
        messageLength: Math.round(avgMsgLenA),
        initiativeRatio: msgs.length > 0
            ? (aMsgs.findIndex(m => m.senderId === userIdA) === 0 ? 0.6 : 0.4)
            : 0.5,
        questionFrequency: aMsgs.length > 0 ? questionCountA / aMsgs.length : 0.2,
    };
    const behB: BehaviorMetrics = {
        responseRate: aMsgs.length > 0 ? Math.min(1, bMsgs.length / aMsgs.length) : 0.3,
        avgResponseTime: Math.round(avgResponseB),
        messageLength: Math.round(avgMsgLenB),
        initiativeRatio: msgs.length > 0
            ? (bMsgs.findIndex(m => m.senderId === userIdB) === 0 ? 0.6 : 0.4)
            : 0.5,
        questionFrequency: bMsgs.length > 0 ? questionCountB / bMsgs.length : 0.2,
    };

    return { chemA, chemB, behA, behB };
}
