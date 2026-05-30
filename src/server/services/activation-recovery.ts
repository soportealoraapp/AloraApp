import { prisma } from '@/lib/prisma';

export interface ActivationAction {
    type: 'profile_completion' | 'first_like' | 'first_match' | 'verification' | 'quiz';
    title: string;
    description: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
}

/**
 * Detect activation recovery opportunities for a user.
 */
export async function detectActivationRecovery(userId: string): Promise<ActivationAction[]> {
    const actions: ActivationAction[] = [];

    const [profile, matchCount, likeCount, quizCount] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId },
            select: {
                photos: true, bio: true, interests: true, values: true,
                isVerified: true, musicGenres: true, lookingFor: true,
            }
        }),
        prisma.match.count({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] }
        }),
        prisma.interaction.count({
            where: { fromUserId: userId }
        }),
        prisma.quizResult.count({ where: { userId } }),
    ]);

    if (!profile) return actions;

    // Check profile completeness
    const photoCount = profile.photos?.length || 0;
    const bioLength = (profile.bio || '').length;
    const interestCount = (profile.interests || []).length;

    if (photoCount < 3) {
        actions.push({
            type: 'profile_completion',
            title: 'Agrega más fotos',
            description: 'Los perfiles con 3+ fotos reciben 3x más visitas',
            impact: 'Alto impacto en visibilidad',
            priority: 'high',
        });
    }

    if (bioLength < 50) {
        actions.push({
            type: 'profile_completion',
            title: 'Escribe tu biografía',
            description: 'Una bio personalizada genera más interés',
            impact: 'Aumenta matches hasta 40%',
            priority: 'high',
        });
    }

    if (interestCount < 3) {
        actions.push({
            type: 'profile_completion',
            title: 'Selecciona tus intereses',
            description: 'Los intereses ayudan a encontrar personas compatibles',
            impact: 'Mejora calidad de matches',
            priority: 'medium',
        });
    }

    if (!profile.isVerified) {
        actions.push({
            type: 'verification',
            title: 'Verifica tu identidad',
            description: 'Los usuarios verificados generan más confianza',
            impact: '+20% en respuestas',
            priority: 'medium',
        });
    }

    if (quizCount === 0) {
        actions.push({
            type: 'quiz',
            title: 'Realiza un quiz de compatibilidad',
            description: 'Los quizzes mejoran tu score de compatibilidad',
            impact: 'Mejora precisión del matching',
            priority: 'low',
        });
    }

    if (likeCount === 0 && matchCount === 0) {
        actions.push({
            type: 'first_like',
            title: 'Explora perfiles y da like',
            description: 'El descubrimiento es el primer paso para conectar',
            impact: 'Necesario para obtener matches',
            priority: 'high',
        });
    }

    return actions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}
