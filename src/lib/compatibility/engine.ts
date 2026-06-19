import { prisma } from '@/lib/prisma';
import { generateExplanations } from './explanations';

/** All profile fields needed by the compatibility engine. */
export interface ProfileData {
    values: string[];
    interests: string[];
    musicGenres: string[];
    smoking: string | null;
    drinking: string | null;
    children: string | null;
    education: string | null;
    religion: string | null;
    bio: string | null;
    seeking: string | null;
    city: string | null;
    zodiacSign: string | null;
}

/** Dimension weights for the weighted total. */
export const WEIGHTS = {
    VALUES: 0.30,
    RELATIONSHIP_GOALS: 0.20,
    PERSONALITY: 0.15,
    QUIZZES: 0.13,
    INTERESTS: 0.10,
    LIFESTYLE: 0.07,
    DAILY_QUESTION: 0.05,
} as const;

export interface CompatibilityResult {
    totalScore: number;
    dimensions: {
        values: number;
        relationshipGoals: number;
        personality: number;
        quizzes: number;
        interests: number;
        lifestyle: number;
        dailyQuestion: number;
    };
    explanations: string[];
    sharedItems: {
        values: string[];
        interests: string[];
        music: string[];
        lifestyle: string[];
    };
    differences: {
        values: string[];
        lifestyle: string[];
    };
}

/**
 * Jaccard similarity between two string arrays.
 */
function jaccardSimilarity(a: string[], b: string[]): number {
    if (a.length === 0 && b.length === 0) return 0;
    const setA = new Set(a.map(s => s.toLowerCase()));
    const setB = new Set(b.map(s => s.toLowerCase()));
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? (intersection / union) * 100 : 0;
}

/**
 * Score values compatibility (30% weight).
 */
function scoreValues(valuesA: string[], valuesB: string[]): number {
    return jaccardSimilarity(valuesA, valuesB);
}

/**
 * Score interests compatibility (10% weight).
 * Includes niche bonus for uncommon shared interests.
 */
function scoreInterests(interestsA: string[], interestsB: string[]): number {
    const base = jaccardSimilarity(interestsA, interestsB);

    // Niche bonus: shared interests NOT in common list get extra points
    const commonInterests = ['música', 'cine', 'viajes', 'comida', 'deporte', 'leer'];
    const setA = new Set(interestsA.map(s => s.toLowerCase()));
    const setB = new Set(interestsB.map(s => s.toLowerCase()));
    const shared = [...setA].filter(x => setB.has(x));
    const nicheShared = shared.filter(i => !commonInterests.includes(i));
    const nicheBonus = Math.min(20, nicheShared.length * 5);

    return Math.min(100, base + nicheBonus);
}

/**
 * Score personality compatibility (15% weight).
 * Infers from bio text keywords.
 */
function scorePersonality(bioA: string, bioB: string, interestsA: string[], interestsB: string[]): number {
    const a = (bioA || '').toLowerCase();
    const b = (bioB || '').toLowerCase();

    let score = 50; // baseline

    // Communication style signals
    const expressiveSignals = ['hablar', 'conversar', 'compartir', 'expresar', 'emociones'];
    const reservedSignals = ['tranquilo', 'silencio', 'paz', 'calma', 'soledad'];

    const aExpressive = expressiveSignals.filter(s => a.includes(s)).length;
    const bExpressive = expressiveSignals.filter(s => b.includes(s)).length;
    const aReserved = reservedSignals.filter(s => a.includes(s)).length;
    const bReserved = reservedSignals.filter(s => b.includes(s)).length;

    // Complementary styles score higher
    if (aExpressive > 0 && bExpressive > 0) score += 10;
    if (aReserved > 0 && bReserved > 0) score += 10;
    if (aExpressive > 0 && bReserved > 0) score += 5; // complementary
    if (aReserved > 0 && bExpressive > 0) score += 5; // complementary

    // Energy signals
    const activeSignals = ['aventura', 'deporte', 'actividad', 'energía', 'viajar'];
    const calmSignals = ['leer', 'casa', 'peliculas', 'series', 'cocinar'];

    const aActive = activeSignals.filter(s => a.includes(s) || interestsA.some(i => i.toLowerCase().includes(s))).length;
    const bActive = activeSignals.filter(s => b.includes(s) || interestsB.some(i => i.toLowerCase().includes(s))).length;
    const aCalm = calmSignals.filter(s => a.includes(s) || interestsA.some(i => i.toLowerCase().includes(s))).length;
    const bCalm = calmSignals.filter(s => b.includes(s) || interestsB.some(i => i.toLowerCase().includes(s))).length;

    if (aActive > 0 && bActive > 0) score += 10;
    if (aCalm > 0 && bCalm > 0) score += 10;
    if (aActive > 0 && bCalm > 0) score += 5;
    if (aCalm > 0 && bActive > 0) score += 5;

    // Bio depth (longer bios = more thoughtful)
    if (a.length > 100) score += 5;
    if (b.length > 100) score += 5;

    return Math.max(0, Math.min(100, score));
}

/**
 * Score quiz compatibility (15% weight).
 * Reads from quiz_results table.
 * Accepts optional pre-fetched quizzes for userA to avoid redundant queries.
 */
async function scoreQuizzes(userIdA: string, userIdB: string, quizzesA?: any[], quizzesB?: any[]): Promise<number> {
    const [qa, qb] = await Promise.all([
        quizzesA ? Promise.resolve(quizzesA) : prisma.quizResult.findMany({ where: { userId: userIdA } }),
        quizzesB ? Promise.resolve(quizzesB) : prisma.quizResult.findMany({ where: { userId: userIdB } }),
    ]);

    if (qa.length === 0 || qb.length === 0) return 50;

    const quizIdsA = new Set(qa.map(q => q.quizId));
    const sharedQuizzes = qb.filter(q => quizIdsA.has(q.quizId));

    if (sharedQuizzes.length === 0) return 50;

    let totalSimilarity = 0;
    for (const quizB of sharedQuizzes) {
        const quizA = qa.find(q => q.quizId === quizB.quizId);
        if (!quizA) continue;

        // Compare answers by score (not by option ID) for accurate compatibility
        const answersA = quizA.answers as Record<string, string>;
        const answersB = quizB.answers as Record<string, string>;
        // Import quiz data to resolve option scores
        const { COMPATIBILITY_QUIZZES } = await import('@/data/quizzes-data');
        const quizDef = COMPATIBILITY_QUIZZES.find(q => q.id === quizB.quizId);
        const allKeys = new Set([...Object.keys(answersA), ...Object.keys(answersB)]);
        let totalScoreDiff = 0;
        let comparedQuestions = 0;
        for (const key of allKeys) {
            const optionA = answersA[key];
            const optionB = answersB[key];
            if (!optionA || !optionB) continue;
            if (quizDef) {
                const question = quizDef.questions.find(q => q.id === key);
                if (question?.options) {
                    const scoreA = question.options.find(o => o.id === optionA)?.score ?? 5;
                    const scoreB = question.options.find(o => o.id === optionB)?.score ?? 5;
                    // Normalize to 0-1 range: max possible diff is 7 (score range 3-10)
                    totalScoreDiff += 1 - Math.abs(scoreA - scoreB) / 7;
                    comparedQuestions++;
                }
            } else {
                // Fallback: exact ID match if quiz definition not found
                if (optionA === optionB) totalScoreDiff += 1;
                comparedQuestions++;
            }
        }
        totalSimilarity += comparedQuestions > 0 ? (totalScoreDiff / comparedQuestions) * 100 : 0;
    }

    return totalSimilarity / sharedQuizzes.length;
}

/**
 * Score daily-question compatibility (5% weight).
 * Rewards shared category + length similarity.
 */
function scoreDailyQuestion(questionA: { category: string | null } | null, answerA: string | null,
                            questionB: { category: string | null } | null, answerB: string | null): number {
    if (!answerA || !answerB || !questionA?.category || !questionB?.category) return 50;
    let score = 50;
    if (questionA.category === questionB.category) score += 30;
    const lenA = answerA.trim().length;
    const lenB = answerB.trim().length;
    if (lenA > 0 && lenB > 0) {
        const ratio = Math.min(lenA, lenB) / Math.max(lenA, lenB);
        score += Math.round(ratio * 20);
    }
    return Math.max(0, Math.min(100, score));
}

/**
 * Score lifestyle compatibility (10% weight).
 */
function scoreLifestyle(profileA: any, profileB: any): number {
    let score = 50;
    let factors = 0;

    if (profileA.smoking && profileB.smoking) {
        factors++;
        if (profileA.smoking === profileB.smoking) score += 20;
        else if (
            (profileA.smoking === 'no' && profileB.smoking !== 'no') ||
            (profileA.smoking !== 'no' && profileB.smoking === 'no')
        ) score -= 5;
    }

    if (profileA.drinking && profileB.drinking) {
        factors++;
        if (profileA.drinking === profileB.drinking) score += 20;
        else score -= 5;
    }

    if (profileA.children && profileB.children) {
        factors++;
        if (profileA.children === profileB.children) score += 20;
        else score -= 10;
    }

    if (profileA.education && profileB.education) {
        factors++;
        const eduLevels = ['secundaria', 'preparatoria', 'universidad', 'maestría', 'doctorado'];
        const levelA = eduLevels.findIndex(e => profileA.education.toLowerCase().includes(e));
        const levelB = eduLevels.findIndex(e => profileB.education.toLowerCase().includes(e));
        if (levelA >= 0 && levelB >= 0) {
            const diff = Math.abs(levelA - levelB);
            score += diff <= 1 ? 15 : diff <= 2 ? 5 : -5;
        }
    }

    if (profileA.religion && profileB.religion) {
        factors++;
        if (profileA.religion === profileB.religion) score += 15;
        else if (profileA.religion === 'ninguna' || profileB.religion === 'ninguna') score += 5;
        else score -= 5;
    }

    return Math.max(0, Math.min(100, score));
}

interface GoalsProfile {
    seeking: string | null;
    values: string[];
    bio: string | null;
}

/**
 * Score relationship goals compatibility based on seeking + values + bio signals.
 * Accepts optional pre-fetched profiles to avoid duplicate Prisma queries.
 */
async function scoreRelationshipGoals(
    userIdA: string,
    userIdB: string,
    profileA?: GoalsProfile | null,
    profileB?: GoalsProfile | null
): Promise<number> {
    const [pA, pB] = (profileA && profileB)
        ? [profileA, profileB]
        : await Promise.all([
            prisma.profile.findUnique({ where: { userId: userIdA }, select: { seeking: true, values: true, bio: true } }),
            prisma.profile.findUnique({ where: { userId: userIdB }, select: { seeking: true, values: true, bio: true } }),
        ]);

    if (!pA || !pB) return 50;

    let score = 50;

    const seekingA = pA.seeking || 'everyone';
    const seekingB = pB.seeking || 'everyone';

    if (seekingA === 'everyone' || seekingB === 'everyone') {
        score += 10;
    }

    const seriousValues = ['relación', 'familia', 'compromiso', 'lealtad', 'crecimiento'];
    const valuesA = (pA.values || []).map(v => v.toLowerCase());
    const valuesB = (pB.values || []).map(v => v.toLowerCase());

    const seriousOverlap = seriousValues.filter(v =>
        valuesA.some(va => va.includes(v)) || valuesB.some(vb => vb.includes(v))
    );
    score += Math.min(30, seriousOverlap.length * 10);

    const bioA = (pA.bio || '').toLowerCase();
    const bioB = (pB.bio || '').toLowerCase();

    const longTermSignals = ['largo plazo', 'serio', 'compromiso', 'futuro', 'matrimonio', 'familia'];
    const casualSignals = ['diversión', 'casual', 'sin compromiso', 'aventura'];

    const aSerious = longTermSignals.some(s => bioA.includes(s));
    const bSerious = longTermSignals.some(s => bioB.includes(s));
    const aCasual = casualSignals.some(s => bioA.includes(s));
    const bCasual = casualSignals.some(s => bioB.includes(s));

    if (aSerious && bSerious) score += 15;
    else if (aCasual && bCasual) score += 15;
    else if (aSerious && bCasual) score -= 10;
    else if (aCasual && bSerious) score -= 10;

    return Math.max(0, Math.min(100, score));
}

/**
 * Pure computation kernel — zero DB queries.
 * Takes pre-computed async scores and two full profiles, returns the final CompatibilityResult.
 */
export function computeCompatibility(
    profileA: ProfileData,
    profileB: ProfileData,
    quizScore: number,
    goalsScore: number,
    dailyScore: number,
): CompatibilityResult {
    const valuesScore = scoreValues(profileA.values || [], profileB.values || []);
    const interestsScore = scoreInterests(profileA.interests || [], profileB.interests || []);
    const personalityScore = scorePersonality(
        profileA.bio || '', profileB.bio || '',
        profileA.interests || [], profileB.interests || []
    );
    const lifestyleScore = scoreLifestyle(profileA, profileB);

    const totalScore = Math.round(
        valuesScore * WEIGHTS.VALUES +
        goalsScore * WEIGHTS.RELATIONSHIP_GOALS +
        personalityScore * WEIGHTS.PERSONALITY +
        quizScore * WEIGHTS.QUIZZES +
        interestsScore * WEIGHTS.INTERESTS +
        lifestyleScore * WEIGHTS.LIFESTYLE +
        dailyScore * WEIGHTS.DAILY_QUESTION
    );

    const dimensions = {
        values: Math.round(valuesScore),
        relationshipGoals: Math.round(goalsScore),
        personality: Math.round(personalityScore),
        quizzes: Math.round(quizScore),
        interests: Math.round(interestsScore),
        lifestyle: Math.round(lifestyleScore),
        dailyQuestion: Math.round(dailyScore),
    };

    const explanations = generateExplanations(dimensions, {
        valuesA: profileA.values || [],
        valuesB: profileB.values || [],
        interestsA: profileA.interests || [],
        interestsB: profileB.interests || [],
        musicGenresA: profileA.musicGenres || [],
        musicGenresB: profileB.musicGenres || [],
        smokingA: profileA.smoking || '',
        smokingB: profileB.smoking || '',
        drinkingA: profileA.drinking || '',
        drinkingB: profileB.drinking || '',
        childrenA: profileA.children || '',
        childrenB: profileB.children || '',
        educationA: profileA.education || '',
        educationB: profileB.education || '',
    });

    const valuesA = new Set((profileA.values || []).map(v => v.toLowerCase()));
    const valuesB = new Set((profileB.values || []).map(v => v.toLowerCase()));
    const sharedValues = [...valuesA].filter(v => valuesB.has(v));

    const interestsA = new Set((profileA.interests || []).map(i => i.toLowerCase()));
    const interestsB = new Set((profileB.interests || []).map(i => i.toLowerCase()));
    const sharedInterests = [...interestsA].filter(i => interestsB.has(i));

    const musicA = new Set((profileA.musicGenres || []).map(m => m.toLowerCase()));
    const musicB = new Set((profileB.musicGenres || []).map(m => m.toLowerCase()));
    const sharedMusic = [...musicA].filter(m => musicB.has(m));

    const lifestyle: string[] = [];
    if (profileA.smoking && profileB.smoking && profileA.smoking === profileB.smoking) {
        lifestyle.push(`Ambos: ${profileA.smoking === 'no' ? 'No fuman' : 'Fuman'}`);
    }
    if (profileA.drinking && profileB.drinking && profileA.drinking === profileB.drinking) {
        lifestyle.push(`Ambos: ${profileA.drinking === 'no' ? 'No beben' : 'Beben'}`);
    }
    if (profileA.children && profileB.children && profileA.children === profileB.children) {
        lifestyle.push(`Ambos: ${profileA.children === 'no' ? 'No tienen hijos' : 'Tienen hijos'}`);
    }

    const valueDiffs = [...valuesA].filter(v => !valuesB.has(v));
    const lifestyleDiffs: string[] = [];
    if (profileA.children && profileB.children && profileA.children !== profileB.children) {
        lifestyleDiffs.push(`Hijos: Tú "${profileA.children}" · Ellos "${profileB.children}"`);
    }
    if (profileA.drinking && profileB.drinking && profileA.drinking !== profileB.drinking) {
        lifestyleDiffs.push(`Alcohol: Tú "${profileA.drinking}" · Ellos "${profileB.drinking}"`);
    }

    return {
        totalScore,
        dimensions,
        explanations,
        sharedItems: { values: sharedValues, interests: sharedInterests, music: sharedMusic, lifestyle },
        differences: { values: valueDiffs, lifestyle: lifestyleDiffs },
    };
}

/**
 * Main compatibility calculation.
 * Returns a 0-100 score with 6 dimension breakdown and explanations.
 * Accepts optional pre-fetched viewer data (userA) to avoid redundant queries
 * when called multiple times from the feed scoring loop.
 */
export async function calculateCompatibility(
    userIdA: string,
    userIdB: string,
    viewerData?: {
        profile: ProfileData;
        quizzes: any[];
        dailyAnswer: { answer: string; question: { category: string } } | null;
    },
    candidateData?: {
        profile: ProfileData;
        quizzes: any[];
        dailyAnswer: { answer: string; question: { category: string } } | null;
    }
): Promise<CompatibilityResult> {
    // Batch-optimized: use pre-fetched candidate profile or query
    const profileB = candidateData?.profile ?? await prisma.profile.findUnique({
        where: { userId: userIdB },
        select: {
            values: true, interests: true, musicGenres: true,
            smoking: true, drinking: true, children: true,
            education: true, religion: true, bio: true,
            seeking: true, city: true, zodiacSign: true,
        }
    });

    let profileA: ProfileData | null = null;
    if (viewerData) {
        profileA = viewerData.profile;
    } else {
        profileA = await prisma.profile.findUnique({
            where: { userId: userIdA },
            select: {
                values: true, interests: true, musicGenres: true,
                smoking: true, drinking: true, children: true,
                education: true, religion: true, bio: true,
                seeking: true, city: true, zodiacSign: true,
            }
        });
    }

    if (!profileA || !profileB) {
        return {
            totalScore: 50,
            dimensions: { values: 50, relationshipGoals: 50, personality: 50, quizzes: 50, interests: 50, lifestyle: 50, dailyQuestion: 50 },
            explanations: ['Perfiles incompletos — no se puede calcular compatibilidad'],
            sharedItems: { values: [], interests: [], music: [], lifestyle: [] },
            differences: { values: [], lifestyle: [] },
        };
    }

    const [quizScore, goalsScore, latestA, latestB] = await Promise.all([
        scoreQuizzes(userIdA, userIdB, viewerData?.quizzes, candidateData?.quizzes),
        scoreRelationshipGoals(userIdA, userIdB, profileA, profileB),
        viewerData?.dailyAnswer !== undefined
            ? Promise.resolve(viewerData.dailyAnswer)
            : prisma.dailyAnswer.findFirst({
                where: { userId: userIdA },
                orderBy: { createdAt: 'desc' },
                select: { answer: true, question: { select: { category: true } } },
            }),
        candidateData?.dailyAnswer !== undefined
            ? Promise.resolve(candidateData.dailyAnswer)
            : prisma.dailyAnswer.findFirst({
                where: { userId: userIdB },
                orderBy: { createdAt: 'desc' },
                select: { answer: true, question: { select: { category: true } } },
            }),
    ]);

    const dailyScore = scoreDailyQuestion(
        latestA?.question ?? null, latestA?.answer ?? null,
        latestB?.question ?? null, latestB?.answer ?? null,
    );

    return computeCompatibility(profileA, profileB, quizScore, goalsScore, dailyScore);
}
