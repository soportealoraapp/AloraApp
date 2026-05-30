import { prisma } from '@/lib/prisma';

export interface GrowthFeedback {
    profileHealth: string;
    visitTrend: 'growing' | 'stable' | 'declining';
    suggestions: { text: string; priority: 'high' | 'medium' | 'low' }[];
    encouragement: string;
}

/**
 * Generate growth feedback for male users.
 */
export async function getGrowthFeedback(userId: string): Promise<GrowthFeedback> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            photos: true, bio: true, interests: true, values: true,
            lastActiveAt: true, isVerified: true,
        }
    });

    if (!profile) {
        return {
            profileHealth: 'unknown',
            visitTrend: 'stable',
            suggestions: [],
            encouragement: '',
        };
    }

    const suggestions: GrowthFeedback['suggestions'] = [];

    // Profile analysis
    const photoCount = profile.photos?.length || 0;
    const bioLength = (profile.bio || '').length;
    const interestCount = (profile.interests || []).length;

    if (photoCount < 3) {
        suggestions.push({ text: 'Agrega fotos con diferentes actividades y expressiones', priority: 'high' });
    } else if (photoCount < 5) {
        suggestions.push({ text: 'Una foto más haría tu perfil más atractivo', priority: 'medium' });
    }

    if (bioLength < 50) {
        suggestions.push({ text: 'Escribe una bio que muestre tu personalidad', priority: 'high' });
    } else if (bioLength < 150) {
        suggestions.push({ text: 'Una bio más detallada genera más interés', priority: 'medium' });
    }

    if (interestCount < 3) {
        suggestions.push({ text: 'Agrega más intereses para encontrar personas compatibles', priority: 'high' });
    }

    if (!profile.isVerified) {
        suggestions.push({ text: 'La verificación aumenta la confianza de otros usuarios', priority: 'medium' });
    }

    // Visit trend analysis
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeekVisits, lastWeekVisits] = await Promise.all([
        prisma.profileVisit.count({ where: { visitedId: userId, createdAt: { gte: oneWeekAgo } } }),
        prisma.profileVisit.count({
            where: {
                visitedId: userId,
                createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo }
            }
        }),
    ]);

    let visitTrend: GrowthFeedback['visitTrend'];
    if (thisWeekVisits > lastWeekVisits * 1.2) visitTrend = 'growing';
    else if (thisWeekVisits < lastWeekVisits * 0.8) visitTrend = 'declining';
    else visitTrend = 'stable';

    if (visitTrend === 'declining') {
        suggestions.push({ text: 'Tu visibilidad ha disminuido. Actualiza tu perfil con algo nuevo', priority: 'high' });
    }

    // Profile health
    const completeness = Math.min(100,
        (photoCount >= 4 ? 25 : photoCount * 6) +
        (bioLength > 100 ? 25 : bioLength / 4) +
        (interestCount >= 5 ? 25 : interestCount * 5) +
        ((profile.values || []).length >= 3 ? 25 : 0)
    );

    let profileHealth: string;
    if (completeness >= 80) profileHealth = 'Tu perfil está en excelente estado';
    else if (completeness >= 60) profileHealth = 'Tu perfil está bien, pero puede mejorar';
    else profileHealth = 'Tu perfil necesita atención';

    // Encouragement
    const encouragements = [
        'Cada día que tu perfil está activo, aumentan tus posibilidades',
        'Los perfiles auténticos atraen conexiones genuinas',
        'La paciencia es clave — las mejores conexiones toman tiempo',
        'Tu perfil mejora con cada actualización',
    ];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    return {
        profileHealth,
        visitTrend,
        suggestions: suggestions.slice(0, 4),
        encouragement,
    };
}
