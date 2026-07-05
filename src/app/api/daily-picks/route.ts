import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { logger } from '@/lib/logger';
import { calculateCompatibility } from '@/lib/compatibility/engine';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'discover');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingPicks = await prisma.dailyPick.findMany({
            where: {
                userId: user.id,
                date: { gte: today },
            },
            orderBy: { score: 'desc' },
            take: 3,
        });

        if (existingPicks.length >= 3) {
            // Batch fetch all profiles in a single query (avoids N+1)
            const profileIds = existingPicks.map(pick => pick.profileId);
            const profiles = await prisma.profile.findMany({
                where: { userId: { in: profileIds } },
                select: {
                    userId: true,
                    displayName: true,
                    age: true,
                    city: true,
                    photos: true,
                    interests: true,
                    values: true,
                    isVerified: true,
                    lastActiveAt: true,
                    bio: true,
                },
            });
            const profileMap = new Map(profiles.map(p => [p.userId, p]));

            const picks = existingPicks.map((pick) => {
                const profile = profileMap.get(pick.profileId);
                return {
                    id: pick.profileId,
                    reason: pick.reason,
                    score: pick.score,
                    ...profile,
                    photo: profile?.photos?.[0] || '/placeholder.svg',
                };
            });
            return NextResponse.json({ picks, cached: true });
        }

        const currentUserProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                interests: true,
                values: true,
                seeking: true,
                latitude: true,
                longitude: true,
                gender: true,
            },
        });

        if (!currentUserProfile) {
            return NextResponse.json({ picks: [], cached: false });
        }

        const blockedUsers = await prisma.block.findMany({
            where: {
                OR: [
                    { blockerId: user.id },
                    { blockedId: user.id },
                ]
            },
            select: { blockerId: true, blockedId: true },
        });
        const blockedIds = blockedUsers.map(b =>
            b.blockerId === user.id ? b.blockedId : b.blockerId
        );

        const interactions = await prisma.interaction.findMany({
            where: { fromUserId: user.id },
            select: { toUserId: true },
        });
        const interactedIds = interactions.map(i => i.toUserId);

        const matches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
            },
            select: { user1Id: true, user2Id: true },
        });
        const matchIds = matches.map(m => m.user1Id === user.id ? m.user2Id : m.user1Id);

        const excludeIds = [user.id, ...blockedIds, ...interactedIds, ...matchIds];

        const candidates = await prisma.profile.findMany({
            where: {
                userId: { notIn: excludeIds },
                user: { deletedAt: null },
                photos: { isEmpty: false },
                trustStatus: { not: 'banned' },
                incognitoMode: false,
                showMeInDiscover: true,
                // Gender filter based on user's seeking preference
                ...(currentUserProfile.seeking === 'women' ? { gender: 'woman' } :
                    currentUserProfile.seeking === 'men' ? { gender: 'man' } : {}),
            },
            select: {
                userId: true,
                displayName: true,
                age: true,
                city: true,
                photos: true,
                interests: true,
                values: true,
                isVerified: true,
                lastActiveAt: true,
                bio: true,
                latitude: true,
                longitude: true,
                reputationScore: true,
            },
            take: 100,
        });

        // Filter by distance (Haversine) if user has location
        const MAX_DISTANCE_KM = 100;
        const userLat = currentUserProfile.latitude;
        const userLon = currentUserProfile.longitude;
        const filteredCandidates = userLat != null && userLon != null
            ? candidates.filter(c => {
                if (c.latitude == null || c.longitude == null) return true;
                const R = 6371;
                const dLat = (c.latitude - userLat) * Math.PI / 180;
                const dLon = (c.longitude - userLon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(userLat * Math.PI / 180) * Math.cos(c.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) ** 2;
                const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return dist <= MAX_DISTANCE_KM;
            })
            : candidates;

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Heuristic pre-filter: score candidates quickly to get top 20
        const preScored = filteredCandidates.map(c => {
            let score = 0;
            const sharedInterests = (currentUserProfile.interests || []).filter(i =>
                (c.interests || []).includes(i)
            ).length;
            score += sharedInterests * 10;
            const sharedValues = (currentUserProfile.values || []).filter(v =>
                (c.values || []).includes(v)
            ).length;
            score += sharedValues * 15;
            if (c.lastActiveAt && new Date(c.lastActiveAt) > oneDayAgo) score += 20;
            else if (c.lastActiveAt && new Date(c.lastActiveAt) > oneWeekAgo) score += 10;
            if (c.isVerified) score += 15;
            if ((c.reputationScore ?? 100) >= 80) score += 10;
            return { id: c.userId, preScore: score, candidate: c };
        });

        preScored.sort((a, b) => b.preScore - a.preScore);
        const topCandidates = preScored.slice(0, 20);

        // Use compatibility engine for accurate scoring on top candidates
        const scored = await Promise.all(topCandidates.map(async ({ id, candidate: c }) => {
            let engineScore = 0;
            let explanations: string[] = [];

            try {
                const compat = await calculateCompatibility(user.id, id);
                engineScore = compat.totalScore;
                explanations = compat.explanations;
            } catch {
                // Fallback to heuristic if engine fails
                engineScore = preScored.find(p => p.id === id)?.preScore ?? 0;
            }

            const reasons: string[] = explanations.length > 0
                ? explanations.slice(0, 2)
                : [];
            if (c.isVerified && !reasons.some(r => r.toLowerCase().includes('verificado'))) {
                reasons.push('Perfil verificado');
            }
            if (c.lastActiveAt && new Date(c.lastActiveAt) > oneDayAgo && !reasons.some(r => r.toLowerCase().includes('activo'))) {
                reasons.push('Activo hoy');
            }

            return {
                id: c.userId,
                displayName: c.displayName,
                age: c.age,
                city: c.city,
                photos: c.photos,
                interests: c.interests,
                values: c.values,
                isVerified: c.isVerified,
                lastActiveAt: c.lastActiveAt,
                bio: c.bio,
                photo: c.photos?.[0] || '/placeholder.svg',
                score: Math.min(100, engineScore),
                reason: reasons.join(' · ') || 'Compatible contigo',
            };
        }));

        scored.sort((a, b) => b.score - a.score);
        const topPicks = scored.slice(0, 3);

        await Promise.all(topPicks.map(pick =>
            prisma.dailyPick.upsert({
                where: {
                    userId_profileId_date: {
                        userId: user.id,
                        profileId: pick.id,
                        date: today,
                    },
                },
                update: { score: pick.score, reason: pick.reason },
                create: {
                    userId: user.id,
                    profileId: pick.id,
                    score: pick.score,
                    reason: pick.reason,
                    date: today,
                },
            })
        ));

        return NextResponse.json({ picks: topPicks, cached: false });
    } catch (error) {
        logger.error('Error generating daily picks', { metadata: { error: error instanceof Error ? error.message : String(error) } });
        return NextResponse.json({ picks: [], cached: false });
    }
}
