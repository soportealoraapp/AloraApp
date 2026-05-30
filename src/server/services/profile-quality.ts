import { prisma } from '@/lib/prisma';

export interface ProfileQualityResult {
    score: number;
    breakdown: {
        photos: number;
        bio: number;
        interests: number;
        values: number;
        music: number;
        goals: number;
        quizzes: number;
        verification: number;
    };
    recommendations: { text: string; impact: number; category: string }[];
}

/**
 * Calculate profile quality score.
 */
export async function calculateProfileQuality(userId: string): Promise<ProfileQualityResult> {
    const [profile, quizCount] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId },
            select: {
                photos: true, bio: true, interests: true, values: true,
                musicGenres: true, lookingFor: true, isVerified: true,
                education: true, city: true, zodiacSign: true, religion: true,
                smoking: true, drinking: true, children: true,
            }
        }),
        prisma.quizResult.count({ where: { userId } }),
    ]);

    if (!profile) {
        return {
            score: 0,
            breakdown: { photos: 0, bio: 0, interests: 0, values: 0, music: 0, goals: 0, quizzes: 0, verification: 0 },
            recommendations: [{ text: 'Crea tu perfil', impact: 100, category: 'basic' }],
        };
    }

    const breakdown = {
        photos: 0,
        bio: 0,
        interests: 0,
        values: 0,
        music: 0,
        goals: 0,
        quizzes: 0,
        verification: 0,
    };

    const recommendations: { text: string; impact: number; category: string }[] = [];

    // Photos (max 20)
    const photoCount = profile.photos?.length || 0;
    if (photoCount >= 4) breakdown.photos = 20;
    else if (photoCount >= 3) breakdown.photos = 15;
    else if (photoCount >= 2) breakdown.photos = 10;
    else if (photoCount >= 1) breakdown.photos = 5;
    else recommendations.push({ text: 'Sube al menos una foto', impact: 15, category: 'photos' });

    if (photoCount < 4) {
        const needed = 4 - photoCount;
        recommendations.push({
            text: `Agrega ${needed} foto${needed > 1 ? 's' : ''} más (+${Math.min(15, needed * 5)}%)`,
            impact: needed * 5,
            category: 'photos'
        });
    }

    // Bio (max 20)
    const bioLength = (profile.bio || '').length;
    if (bioLength > 200) breakdown.bio = 20;
    else if (bioLength > 100) breakdown.bio = 15;
    else if (bioLength > 50) breakdown.bio = 10;
    else if (bioLength > 10) breakdown.bio = 5;
    else recommendations.push({ text: 'Escribe una biografía que te represente', impact: 15, category: 'bio' });

    // Interests (max 15)
    const interestCount = (profile.interests || []).length;
    if (interestCount >= 7) breakdown.interests = 15;
    else if (interestCount >= 5) breakdown.interests = 12;
    else if (interestCount >= 3) breakdown.interests = 8;
    else if (interestCount >= 1) breakdown.interests = 4;
    else recommendations.push({ text: 'Selecciona al menos 3 intereses', impact: 10, category: 'interests' });

    if (interestCount < 5) {
        recommendations.push({
            text: `Agrega ${5 - interestCount} intereses más (+${Math.min(8, (5 - interestCount) * 2)}%)`,
            impact: (5 - interestCount) * 2,
            category: 'interests'
        });
    }

    // Values (max 15)
    const valueCount = (profile.values || []).length;
    if (valueCount >= 4) breakdown.values = 15;
    else if (valueCount >= 3) breakdown.values = 12;
    else if (valueCount >= 2) breakdown.values = 8;
    else if (valueCount >= 1) breakdown.values = 4;
    else recommendations.push({ text: 'Define tus valores principales', impact: 10, category: 'values' });

    // Music (max 10)
    const musicCount = (profile.musicGenres || []).length;
    if (musicCount >= 3) breakdown.music = 10;
    else if (musicCount >= 2) breakdown.music = 7;
    else if (musicCount >= 1) breakdown.music = 4;
    else recommendations.push({ text: 'Agrega tus géneros musicales favoritos', impact: 5, category: 'music' });

    // Goals (max 10)
    if (profile.lookingFor) breakdown.goals = 10;
    else recommendations.push({ text: 'Define qué relación buscas', impact: 8, category: 'goals' });

    // Quizzes (max 5)
    if (quizCount >= 3) breakdown.quizzes = 5;
    else if (quizCount >= 1) breakdown.quizzes = 3;
    else recommendations.push({ text: 'Realiza al menos un quiz de compatibilidad', impact: 4, category: 'quizzes' });

    // Verification (max 5)
    if (profile.isVerified) breakdown.verification = 5;
    else recommendations.push({ text: 'Verifica tu identidad (+5%)', impact: 5, category: 'verification' });

    // Sort recommendations by impact
    recommendations.sort((a, b) => b.impact - a.impact);

    const totalScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return { score: totalScore, breakdown, recommendations: recommendations.slice(0, 5) };
}
