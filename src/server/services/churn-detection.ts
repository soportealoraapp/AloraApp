import { prisma } from '@/lib/prisma';

export interface ChurnRisk {
    userId: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    reasons: string[];
    recommendations: string[];
}

/**
 * Detect users at risk of churning.
 */
export async function detectChurnRisk(userId: string): Promise<ChurnRisk> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            lastActiveAt: true, createdAt: true, photos: true, bio: true,
            interests: true, isVerified: true,
        }
    });

    if (!profile) {
        return { userId, riskLevel: 'low', riskScore: 0, reasons: [], recommendations: [] };
    }

    const now = new Date();
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // 1. Inactivity
    const daysSinceActive = profile.lastActiveAt
        ? (now.getTime() - profile.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

    if (daysSinceActive > 14) {
        riskScore += 30;
        reasons.push('Sin actividad por más de 2 semanas');
        recommendations.push('Vuelve a Alora para ver nuevos perfiles compatibles');
    } else if (daysSinceActive > 7) {
        riskScore += 15;
        reasons.push('Sin actividad por más de 1 semana');
    }

    // 2. No matches
    const matchCount = await prisma.match.count({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) }
        }
    });

    if (matchCount === 0) {
        riskScore += 25;
        reasons.push('Sin matches en las últimas 2 semanas');
        recommendations.push('Mejora tu perfil para atraer más compatibilidades');
    }

    // 3. No responses to messages
    const sentMessages = await prisma.message.count({
        where: { senderId: userId, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
    });

    const receivedReplies = await prisma.message.findMany({
        where: {
            match: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            senderId: { not: userId },
            createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { id: true }
    });

    if (sentMessages > 5 && receivedReplies.length === 0) {
        riskScore += 20;
        reasons.push('Enviaste mensajes pero no recibiste respuestas');
        recommendations.push('Intenta con un perfil diferente o mejora tu primer mensaje');
    }

    // 4. Incomplete profile
    const photoCount = profile.photos?.length || 0;
    const bioLength = (profile.bio || '').length;
    const interestCount = (profile.interests || []).length;

    if (photoCount < 2 || bioLength < 30 || interestCount < 2) {
        riskScore += 15;
        reasons.push('Perfil incompleto reduce visibilidad');
        recommendations.push('Completa tu perfil para mejorar tus oportunidades');
    }

    // 5. Not verified
    if (!profile.isVerified) {
        riskScore += 5;
        recommendations.push('Verifica tu identidad para generar más confianza');
    }

    riskScore = Math.min(100, riskScore);

    let riskLevel: ChurnRisk['riskLevel'];
    if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    return { userId, riskLevel, riskScore, reasons, recommendations };
}

/**
 * Get all at-risk users (admin function).
 */
export async function getAtRiskUsers(limit: number = 50) {
    const inactiveUsers = await prisma.profile.findMany({
        where: {
            lastActiveAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { userId: true },
        take: limit,
    });

    const risks = await Promise.all(
        inactiveUsers.map(u => detectChurnRisk(u.userId))
    );

    return risks.filter(r => r.riskLevel !== 'low').sort((a, b) => b.riskScore - a.riskScore);
}
