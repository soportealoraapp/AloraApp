import { prisma } from '@/lib/prisma';

/**
 * Calculate relationship goals compatibility.
 * Compares seeking preferences and infers intent from profile data.
 */
export async function scoreRelationshipGoals(userIdA: string, userIdB: string): Promise<number> {
    const [profileA, profileB] = await Promise.all([
        prisma.profile.findUnique({ where: { userId: userIdA }, select: { seeking: true, values: true, bio: true } }),
        prisma.profile.findUnique({ where: { userId: userIdB }, select: { seeking: true, values: true, bio: true } }),
    ]);

    if (!profileA || !profileB) return 50;

    let score = 50; // baseline

    // Seeking alignment
    const seekingA = profileA.seeking || 'everyone';
    const seekingB = profileB.seeking || 'everyone';

    if (seekingA === 'everyone' || seekingB === 'everyone') {
        score += 10; // flexible
    }

    // Both looking for something serious (inferred from values)
    const seriousValues = ['relación', 'familia', 'compromiso', 'lealtad', 'crecimiento'];
    const valuesA = (profileA.values || []).map(v => v.toLowerCase());
    const valuesB = (profileB.values || []).map(v => v.toLowerCase());

    const seriousOverlap = seriousValues.filter(v =>
        valuesA.some(va => va.includes(v)) || valuesB.some(vb => vb.includes(v))
    );
    score += Math.min(30, seriousOverlap.length * 10);

    // Bio intent signals
    const bioA = (profileA.bio || '').toLowerCase();
    const bioB = (profileB.bio || '').toLowerCase();

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
