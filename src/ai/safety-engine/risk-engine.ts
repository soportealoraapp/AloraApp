'use server';

import { prisma } from '@/lib/prisma';
import { updateReputation } from '@/server/services/anti-abuse';

export interface RiskAssessment {
    overallRisk: number;           // 0-1
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    dimensions: {
        loveBombing: number;       // 0-1
        manipulation: number;      // 0-1
        coercion: number;          // 0-1
        harassment: number;        // 0-1
        scam: number;              // 0-1
        catfish: number;           // 0-1
        unsafeEscalation: number;  // 0-1
        copyPasteSeduction: number; // 0-1
    };
    signals: SafetySignal[];
    requiresIntervention: boolean;
    suggestedActions: SafetyAction[];
    crossUserPatterns: CrossUserPattern[];
}

export interface SafetySignal {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
    timestamp: Date;
    messageId?: string;
    confidence: number;
}

export interface SafetyAction {
    type: 'warning' | 'message_review' | 'cooldown' | 'trust_reduction' | 'shadowban' | 'admin_escalation';
    target: 'sender' | 'receiver' | 'conversation';
    reason: string;
    duration?: number; // minutes for cooldown
    autoExecute: boolean;
}

export interface CrossUserPattern {
    pattern: string;
    usersInvolved: number;
    details: string;
    riskContribution: number;
}

// Pattern definitions
const LOVE_BOMBING_PATTERNS = [
    { pattern: /\b(alma gemela|media naranja|destinad[oa]s|perfect[oa] para mí)\b/i, weight: 0.3 },
    { pattern: /\b(nunca sentí|nunca conocí|nunca había)\b/i, weight: 0.2 },
    { pattern: /\b(cas?arnos|boda|huyamos juntos|juntos para siempre)\b/i, weight: 0.4 },
    { pattern: /\b(te amo|te adoro) en la primera (conversación|cita|vez|semana)/i, weight: 0.5 },
    { pattern: /\b(regalos|sorpresas|detalles) demasiado pronto/i, weight: 0.2 },
];

const MANIPULATION_PATTERNS = [
    { pattern: /\b(si realmente te importara|si me quisieras)\b/i, weight: 0.3 },
    { pattern: /\b(eres el único|eres la única|nadie me entiende como tú)\b/i, weight: 0.2 },
    { pattern: /\b(tú eres mi razón|sin ti no)\b/i, weight: 0.3 },
    { pattern: /\b(nadie más te va a|nadie te va a querer como)\b/i, weight: 0.5 },
    { pattern: /\b(me vas a dejar?|me abandonas?|te vas a arrepentir)\b/i, weight: 0.3 },
    { pattern: /\b(mereces a alguien mejor que yo|no soy suficiente para ti)\b/i, weight: 0.2 },
];

const COERCION_PATTERNS = [
    { pattern: /\b(si no haces|si no me envías|si no vienes)\b/i, weight: 0.5 },
    { pattern: /\b(tienes que|debes|obligada|obligado)\b/i, weight: 0.3 },
    { pattern: /\b(envíame una foto|mándame una foto|enséñame)\b/i, weight: 0.4 },
    { pattern: /\b(no le digas a nadie|guárdalo secreto|no se lo cuentes)\b/i, weight: 0.4 },
    { pattern: /\b(te estoy grabando|tengo capturas|tengo pruebas)\b/i, weight: 0.6 },
    { pattern: /\b(si no haces lo que te digo)\b/i, weight: 0.6 },
];

const HARASSMENT_PATTERNS = [
    { pattern: /\b(put[ao]|zorra|perra|maric[oó]n|golfa)\b/i, weight: 0.4 },
    { pattern: /\b(insulto|humillación|despreciable|asqueros[oa])\b/i, weight: 0.3 },
    { pattern: /\b(déjame?|no me escribas|déjame en paz|bloquear)\b.*\b(no|insiste|sigue)/i, weight: 0.5 },
    { pattern: /\b(te voy a encontrar|sé dónde vives|sé dónde trabajas)\b/i, weight: 0.8 },
    { pattern: /\b(te voy a|te haré|vas a ver)\b.*\b(dañar|lastimar|arrepentir)/i, weight: 0.7 },
];

const SCAM_PATTERNS = [
    { pattern: /\b(transferencia|wester.?union|money.?gram|bitcoin|crypto|inversi[oó]n f[áa]cil)\b/i, weight: 0.4 },
    { pattern: /\b(gana dinero rápido|hazte rico|oportunidad única|negocio seguro)\b/i, weight: 0.4 },
    { pattern: /\b(mi tío|mi papá|mi abogado|herencia|premio|lotería) (necesita|requiere|tiene)\b/i, weight: 0.3 },
    { pattern: /\b(envíame|mándame|deposita|préstame|necesito \$|me urge dinero|pr[ée]stamo)\b/i, weight: 0.5 },
    { pattern: /\b(link|enlace|click|pincha|ingresa) (a|en) (mi|este|el siguiente)\b/i, weight: 0.3 },
    { pattern: /\b(número de cuenta|clabe|paypal|tarjeta|datos bancarios)\b/i, weight: 0.6 },
];

const COPY_PASTE_SEDUCTION = [
    { pattern: /\beres (tan|muy|súper) (hermos[oa]|lind[oa]|guap[oa]|especial|interesante)\b/i, weight: 0.2 },
    { pattern: /\b(nunca había conocido a alguien como tú|eres diferente a todos)\b/i, weight: 0.2 },
    { pattern: /\b(qué haces?|cómo estuvo tu día?) demasiado genérico/i, weight: 0.1 },
    { pattern: /^(hola|hey|hello|buenas|qué tal)\s*(guap[oa]|hermos[oa]|belleza|lindura)/i, weight: 0.2 },
];

interface PatternMatch {
    pattern: string;
    matches: number;
    totalWeight: number;
    maxWeight: number;
}

async function scanMessageForPatterns(
    content: string,
    patterns: { pattern: RegExp; weight: number }[],
): Promise<PatternMatch[]> {
    const results: PatternMatch[] = [];
    for (const p of patterns) {
        const matches = (content.match(p.pattern) || []).length;
        if (matches > 0) {
            results.push({
                pattern: p.pattern.source.substring(0, 60),
                matches,
                totalWeight: p.weight * matches,
                maxWeight: p.weight,
            });
        }
    }
    return results;
}

function calculateDimensionRisk(
    matches: { totalWeight: number; maxWeight: number }[],
    frequency: number,
): number {
    if (matches.length === 0) return 0;
    const intensity = matches.reduce((sum, m) => sum + m.totalWeight, 0) / matches.length;
    const countFactor = Math.min(1, matches.length / 5);
    const freqFactor = Math.min(1, frequency / 10);
    return Math.min(1, intensity * 0.5 + countFactor * 0.3 + freqFactor * 0.2);
}

export async function analyzeMessageSafety(
    messageId: string,
    senderId: string,
    receiverId: string,
    content: string,
    matchMessageCount: number,
): Promise<{
    assessment: RiskAssessment;
    shouldBlock: boolean;
    shouldFlag: boolean;
}> {
    const now = new Date();
    const signals: SafetySignal[] = [];
    let shouldBlock = false;
    let shouldFlag = false;

    // Scan all pattern categories
    const [loveBomb, manip, coerc, harass, scam, cps] = await Promise.all([
        scanMessageForPatterns(content, LOVE_BOMBING_PATTERNS),
        scanMessageForPatterns(content, MANIPULATION_PATTERNS),
        scanMessageForPatterns(content, COERCION_PATTERNS),
        scanMessageForPatterns(content, HARASSMENT_PATTERNS),
        scanMessageForPatterns(content, SCAM_PATTERNS),
        scanMessageForPatterns(content, COPY_PASTE_SEDUCTION),
    ]);

    const loveBombingRisk = calculateDimensionRisk(loveBomb, loveBomb.length);
    const manipulationRisk = calculateDimensionRisk(manip, manip.length);
    const coercionRisk = calculateDimensionRisk(coerc, coerc.length);
    const harassmentRisk = calculateDimensionRisk(harass, harass.length);
    const scamRisk = calculateDimensionRisk(scam, scam.length);
    const copyPasteRisk = calculateDimensionRisk(cps, cps.length);

    // Cross-user patterns: check if this sender repeats the same message
    const crossUserPatterns: CrossUserPattern[] = [];
    if (cps.length > 0 || loveBomb.length > 0) {
        // Check if similar messages were sent to other users
        const similarRecentMessages = await prisma.message.findMany({
            where: {
                senderId,
                content: { contains: content.substring(0, 30) },
                createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        if (similarRecentMessages.length >= 3) {
            crossUserPatterns.push({
                pattern: 'Copy-paste opener sent to multiple users',
                usersInvolved: similarRecentMessages.length,
                details: `Same message sent to ${similarRecentMessages.length} different users`,
                riskContribution: 0.3,
            });
        }

        // Check device sharing
        const senderDevice = await prisma.deviceFingerprint.findFirst({
            where: { userId: senderId },
            orderBy: { lastSeen: 'desc' },
        });

        if (senderDevice) {
            const sameDeviceUsers = await prisma.deviceFingerprint.findMany({
                where: { deviceHash: senderDevice.deviceHash, userId: { not: senderId } },
                select: { userId: true },
                distinct: ['userId'],
            });

            if (sameDeviceUsers.length > 0) {
                crossUserPatterns.push({
                    pattern: 'Multi-account via shared device',
                    usersInvolved: sameDeviceUsers.length + 1,
                    details: `Device shared with ${sameDeviceUsers.length} other account(s)`,
                    riskContribution: 0.4,
                });
            }
        }
    }

    // Catfish detection: check if photos are used by multiple accounts
    const senderProfile = await prisma.profile.findUnique({ where: { userId: senderId } });
    let catfishRisk = 0;
    if (senderProfile && senderProfile.photos.length > 0) {
        for (const photo of senderProfile.photos) {
            const duplicates = await prisma.profile.count({
                where: {
                    userId: { not: senderId },
                    photos: { has: photo },
                },
            });
            if (duplicates > 0) {
                catfishRisk = Math.min(1, catfishRisk + 0.3 * duplicates);
                crossUserPatterns.push({
                    pattern: 'Photo used across multiple accounts',
                    usersInvolved: duplicates + 1,
                    details: `Photo found in ${duplicates} other profile(s)`,
                    riskContribution: 0.5,
                });
            }
        }
    }

    // Calculate unsafe escalation: progression of risk over conversations
    const previousMessages = await prisma.message.findMany({
        where: { senderId, receiverId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { content: true, createdAt: true },
    });
    const escalationScore = calculateEscalation(previousMessages, { loveBombingRisk, manipulationRisk, coercionRisk, harassmentRisk });

    // Build signals
    const dimensions = {
        loveBombing: loveBombingRisk,
        manipulation: manipulationRisk,
        coercion: coercionRisk,
        harassment: harassmentRisk,
        scam: scamRisk,
        catfish: catfishRisk,
        unsafeEscalation: escalationScore,
        copyPasteSeduction: copyPasteRisk,
    };

    for (const [dim, risk] of Object.entries(dimensions)) {
        if (risk > 0.3) {
            signals.push({
                type: dim,
                severity: risk > 0.7 ? 'critical' : risk > 0.5 ? 'warning' : 'info',
                description: `${dim} detected (risk: ${Math.round(risk * 100)}%)`,
                timestamp: now,
                messageId,
                confidence: risk,
            });
        }
    }

    // Overall risk
    const dimensionValues = Object.values(dimensions);
    const overallRisk = dimensionValues.reduce((a, b) => a + b, 0) / dimensionValues.length;
    const crossUserFactor = crossUserPatterns.reduce((a, p) => a + p.riskContribution, 0);
    const adjustedRisk = Math.min(1, overallRisk * 0.7 + crossUserFactor * 0.3);

    let riskLevel: RiskAssessment['riskLevel'] = 'safe';
    if (adjustedRisk >= 0.8) riskLevel = 'critical';
    else if (adjustedRisk >= 0.6) riskLevel = 'high';
    else if (adjustedRisk >= 0.4) riskLevel = 'medium';
    else if (adjustedRisk >= 0.15) riskLevel = 'low';

    // Suggested actions
    const suggestedActions: SafetyAction[] = [];
    if (adjustedRisk >= 0.6) {
        suggestedActions.push({
            type: 'message_review',
            target: 'sender',
            reason: 'High-risk patterns detected in message content',
            autoExecute: true,
        });
        shouldBlock = true;
        shouldFlag = true;
    }
    if (adjustedRisk >= 0.4) {
        suggestedActions.push({
            type: 'warning',
            target: 'sender',
            reason: 'Conversation patterns flagged as potentially harmful',
            autoExecute: false,
        });
        suggestedActions.push({
            type: 'trust_reduction',
            target: 'sender',
            reason: 'Trust score reduced due to risk patterns',
            autoExecute: true,
        });
        shouldFlag = true;
    }
    if (adjustedRisk >= 0.3) {
        suggestedActions.push({
            type: 'cooldown',
            target: 'conversation',
            reason: 'Cooldown recommended to prevent escalation',
            duration: 60,
            autoExecute: false,
        });
    }

    // Check overall dimensions for intervention need
    const requiresIntervention = adjustedRisk >= 0.5 || harassmentRisk > 0.6 || coercionRisk > 0.5;

    // Auto-execute trust reduction
    if (adjustedRisk >= 0.3) {
        const penalty = Math.round(adjustedRisk * 20);
        await prisma.profile.update({
            where: { userId: senderId },
            data: { reputationScore: { decrement: penalty } },
        });
        await updateReputation(senderId);
    }

    // Log audit
    if (adjustedRisk >= 0.3) {
        await prisma.auditLog.create({
            data: {
                userId: senderId,
                action: 'safety_risk_detected',
                details: {
                    riskLevel,
                    overallRisk: adjustedRisk,
                    dimensions,
                    messagePreview: content.substring(0, 100),
                    crossUserPatterns,
                },
            },
        });
    }

    return {
        assessment: {
            overallRisk: Math.round(adjustedRisk * 100) / 100,
            riskLevel,
            dimensions,
            signals,
            requiresIntervention,
            suggestedActions,
            crossUserPatterns,
        },
        shouldBlock,
        shouldFlag,
    };
}

function calculateEscalation(
    previousMessages: { content: string; createdAt: Date }[],
    currentLevels: Record<string, number>,
): number {
    if (previousMessages.length < 3) return 0;

    // Check if risk has been increasing over time
    const halves = [
        previousMessages.slice(0, Math.floor(previousMessages.length / 2)),
        previousMessages.slice(Math.floor(previousMessages.length / 2)),
    ];

    const riskInFirstHalf = halves[0].filter(m =>
        HARASSMENT_PATTERNS.some(p => p.pattern.test(m.content)) ||
        COERCION_PATTERNS.some(p => p.pattern.test(m.content))
    ).length;

    const riskInSecondHalf = halves[1].filter(m =>
        HARASSMENT_PATTERNS.some(p => p.pattern.test(m.content)) ||
        COERCION_PATTERNS.some(p => p.pattern.test(m.content))
    ).length;

    // Escalation is when second half has more risk than first
    const currentEscalation = Object.values(currentLevels).reduce((a, b) => a + b, 0) / Object.values(currentLevels).length || 0;

    if (riskInSecondHalf > riskInFirstHalf * 1.5 && currentEscalation > 0.2) {
        return Math.min(1, currentEscalation + 0.2);
    }

    return currentEscalation;
}

export async function getSenderHistory(senderId: string): Promise<{
    totalReports: number;
    totalBlocks: number;
    uniqueConversationPartners: number;
    repeatedOpeners: number;
    riskScore: number;
}> {
    const [reports, blocks, messages] = await Promise.all([
        prisma.report.count({ where: { reportedId: senderId } }),
        prisma.block.count({ where: { blockedId: senderId } }),
        prisma.message.findMany({
            where: { senderId },
            select: { receiverId: true, content: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
    ]);

    const uniquePartners = new Set(messages.map(m => m.receiverId)).size;

    // Check for repeated openers
    const recentMessages = messages.slice(0, 20);
    const openerMap = new Map<string, number>();
    for (const m of recentMessages) {
        const first30 = m.content.substring(0, 30).toLowerCase();
        openerMap.set(first30, (openerMap.get(first30) || 0) + 1);
    }
    const repeatedOpeners = Array.from(openerMap.values()).filter(c => c > 1).length;

    const riskScore = Math.min(1,
        (reports * 0.15) +
        (blocks * 0.1) +
        (repeatedOpeners * 0.05)
    );

    return {
        totalReports: reports,
        totalBlocks: blocks,
        uniqueConversationPartners: uniquePartners,
        repeatedOpeners,
        riskScore,
    };
}
