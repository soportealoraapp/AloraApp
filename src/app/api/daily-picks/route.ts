import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
            const picks = await Promise.all(
                existingPicks.map(async (pick) => {
                    const profile = await prisma.profile.findUnique({
                        where: { userId: pick.profileId },
                        select: {
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
                    return {
                        id: pick.profileId,
                        reason: pick.reason,
                        score: pick.score,
                        ...profile,
                        photo: profile?.photos?.[0] || '/placeholder.svg',
                    };
                })
            );
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
            where: { blockerId: user.id },
            select: { blockedId: true },
        });
        const blockedIds = blockedUsers.map(b => b.blockedId);

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
                photos: { isEmpty: false },
                trustStatus: { not: 'banned' },
                incognitoMode: false,
                showMeInDiscover: true,
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
            take: 50,
        });

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const scored = candidates.map(c => {
            let score = 0;

            const sharedInterests = (currentUserProfile.interests || []).filter(i =>
                (c.interests || []).includes(i)
            ).length;
            score += sharedInterests * 10;

            const sharedValues = (currentUserProfile.values || []).filter(v =>
                (c.values || []).includes(v)
            ).length;
            score += sharedValues * 15;

            if (c.lastActiveAt && new Date(c.lastActiveAt) > oneDayAgo) {
                score += 20;
            } else if (c.lastActiveAt && new Date(c.lastActiveAt) > oneWeekAgo) {
                score += 10;
            }

            if (c.isVerified) score += 15;
            if ((c.reputationScore ?? 100) >= 80) score += 10;

            if (currentUserProfile.latitude && currentUserProfile.longitude && c.latitude && c.longitude) {
                const dist = getDistance(
                    currentUserProfile.latitude, currentUserProfile.longitude,
                    c.latitude, c.longitude
                );
                if (dist < 10) score += 15;
                else if (dist < 30) score += 10;
                else if (dist < 50) score += 5;
            }

            const reasons: string[] = [];
            if (sharedInterests > 0) reasons.push(`${sharedInterests} interés${sharedInterests > 1 ? 'es' : ''} en común`);
            if (sharedValues > 0) reasons.push(`${sharedValues} valor${sharedValues > 1 ? 'es' : ''} compartido${sharedValues > 1 ? 's' : ''}`);
            if (c.isVerified) reasons.push('Verificado');
            if (c.lastActiveAt && new Date(c.lastActiveAt) > oneDayAgo) reasons.push('Activo hoy');

            return {
                userId: c.userId,
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
                score,
                reason: reasons.join(' · ') || 'Compatible',
            };
        });

        scored.sort((a, b) => b.score - a.score);
        const topPicks = scored.slice(0, 3);

        // Replace reasons with real compatibility engine explanations (if flag enabled)
        const { getFlag } = await import('@/lib/product/flags');
        const reasoning = await getFlag(user.id, 'dailyPickReasoning');
        if (reasoning === 'engine') {
            const { calculateCompatibility } = await import('@/lib/compatibility/engine');
            await Promise.all(topPicks.map(async (pick) => {
                const compat = await calculateCompatibility(user.id, pick.userId);
                if (compat.explanations.length > 0) {
                    pick.reason = compat.explanations.slice(0, 2).join(' · ');
                }
            }));
        }

        for (const pick of topPicks) {
            await prisma.dailyPick.upsert({
                where: {
                    userId_profileId_date: {
                        userId: user.id,
                        profileId: pick.userId,
                        date: today,
                    },
                },
                update: { score: pick.score, reason: pick.reason },
                create: {
                    userId: user.id,
                    profileId: pick.userId,
                    score: pick.score,
                    reason: pick.reason,
                    date: today,
                },
            });
        }

        return NextResponse.json({ picks: topPicks, cached: false });
    } catch (error) {
        console.error('Error generating daily picks:', error);
        return NextResponse.json({ picks: [], cached: false });
    }
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
