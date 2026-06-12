import { prisma } from '@/lib/prisma';

export interface TrustScoreResult {
    score: number;
    level: 'Nuevo' | 'Confiable' | 'Muy Confiable' | 'Destacado' | 'Premium Confiable';
    reasons: string[];
    improvementTips: string[];
}

const LEVEL_THRESHOLDS = [
    { min: 0, level: 'Nuevo' as const },
    { min: 30, level: 'Confiable' as const },
    { min: 55, level: 'Muy Confiable' as const },
    { min: 75, level: 'Destacado' as const },
    { min: 90, level: 'Premium Confiable' as const },
];

/**
 * Calculate trust score for a user based on multiple signals.
 */
export async function calculateTrustScore(userId: string): Promise<TrustScoreResult> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            photos: true, bio: true, interests: true, values: true,
            isVerified: true, reputationScore: true, lastActiveAt: true,
            createdAt: true, musicGenres: true, lookingFor: true,
            education: true, city: true, zodiacSign: true,
        }
    });

    if (!profile) {
        return { score: 0, level: 'Nuevo', reasons: ['Perfil no encontrado'], improvementTips: ['Crea tu perfil'] };
    }

    let score = 0;
    const reasons: string[] = [];
    const improvementTips: string[] = [];

    // 1. Profile completeness (max 25 points)
    const photoCount = profile.photos?.length || 0;
    if (photoCount >= 4) { score += 10; reasons.push('Buenas fotos'); }
    else if (photoCount >= 2) { score += 5; reasons.push('Fotos aceptables'); }
    else { improvementTips.push('Agrega más fotos para generar confianza'); }

    if ((profile.bio || '').length > 100) { score += 8; reasons.push('Bio detallada'); }
    else if ((profile.bio || '').length > 30) { score += 4; reasons.push('Bio presente'); }
    else { improvementTips.push('Escribe una bio más detallada'); }

    if ((profile.interests || []).length >= 5) { score += 4; reasons.push('Intereses completos'); }
    else if ((profile.interests || []).length >= 2) { score += 2; }
    else { improvementTips.push('Agrega más intereses'); }

    if ((profile.values || []).length >= 3) { score += 3; reasons.push('Valores definidos'); }
    else { improvementTips.push('Define tus valores principales'); }

    // 2. Verification (max 20 points)
    if (profile.isVerified) { score += 20; reasons.push('Identidad verificada'); }
    else { improvementTips.push('Verifica tu identidad para ganar confianza'); }

    // 3. Activity (max 20 points)
    const now = new Date();
    const lastActive = profile.lastActiveAt ? new Date(profile.lastActiveAt) : null;
    if (lastActive) {
        const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        if (hoursSinceActive < 24) { score += 15; reasons.push('Activo recientemente'); }
        else if (hoursSinceActive < 72) { score += 10; reasons.push('Activo esta semana'); }
        else if (hoursSinceActive < 168) { score += 5; }
        else { improvementTips.push('Actívate más para mejorar tu visibilidad'); }
    }

    const accountAge = (now.getTime() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge > 30) { score += 5; reasons.push('Cuenta establecida'); }

    // 4. Reputation (max 20 points)
    const reputation = profile.reputationScore ?? 100;
    if (reputation >= 90) { score += 20; reasons.push('Excelente reputación'); }
    else if (reputation >= 70) { score += 15; reasons.push('Buena reputación'); }
    else if (reputation >= 50) { score += 10; }
    else { improvementTips.push('Mejora tu comportamiento en la plataforma'); }

    // 5. Profile richness (max 15 points)
    if (profile.zodiacSign) { score += 2; }
    if (profile.education) { score += 3; }
    if (profile.city) { score += 3; }
    if ((profile.musicGenres || []).length >= 2) { score += 3; reasons.push('Gustos musicales definidos'); }
    if (profile.lookingFor) { score += 4; reasons.push('Objetivos claros'); }
    else { improvementTips.push('Define qué buscas para atraer personas compatibles'); }

    score = Math.min(100, Math.max(0, score));

    // Determine level
    let level = LEVEL_THRESHOLDS[0].level;
    for (const threshold of LEVEL_THRESHOLDS) {
        if (score >= threshold.min) level = threshold.level;
    }

    return { score, level, reasons, improvementTips };
}

/**
 * Get trust badge color based on level.
 */
export function getTrustBadgeColor(level: string): string {
    switch (level) {
        case 'Premium Confiable': return 'bg-accent/10 text-accent-foreground border-accent/20';
        case 'Destacado': return 'bg-primary/10 text-primary border-primary/20';
        case 'Muy Confiable': return 'bg-success/10 text-success-foreground border-success/20';
        case 'Confiable': return 'bg-warning/10 text-warning-foreground border-warning/20';
        default: return 'bg-muted text-muted-foreground border-border';
    }
}
