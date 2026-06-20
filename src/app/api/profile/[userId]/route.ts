import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { recordProfileVisit } from '@/server/services/visit-tracker';
import { notifyProfileVisit } from '@/server/services/push';
import { getLatestAnswerForUserById } from '@/server/services/daily-question';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/profile/[userId]
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    const params = await props.params;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileView');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const targetUserId = params.userId;
        const { searchParams } = new URL(request.url);
        const isPreview = searchParams.get('preview') === '1';

        // Block check: ALWAYS enforce, even in preview mode
        const blockExists = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: user.id, blockedId: targetUserId },
                    { blockerId: targetUserId, blockedId: user.id }
                ]
            }
        });
        if (blockExists) {
            return NextResponse.json({ error: 'Profile not available' }, { status: 404 });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: targetUserId },
            select: {
                userId: true,
                displayName: true,
                bio: true,
                age: true,
                gender: true,
                photos: true,
                interests: true,
                city: true,
                countryCode: true,
                lookingFor: true,
                connectionModes: true,
                isVerified: true,
                isCompleted: true,

                badges: true,
                dailyLikesUsed: true,
                superlikesRemaining: true,
                lastActiveAt: true,
                subscriptionStatus: true,
                trustStatus: true,
                reputationScore: true,
                createdAt: true,
                // Needed for incognito check, excluded from response below
                incognitoMode: true,
                showMeInDiscover: true,
            },
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Incognito mode: return limited profile data to non-matched users
        const isOwnProfile = user.id === targetUserId;
        if (!isOwnProfile && (profile.incognitoMode || !profile.showMeInDiscover)) {
            // Check if viewer is matched with this user
            const [u1, u2] = [user.id, targetUserId].sort();
            const existingMatch = await prisma.match.findFirst({
                where: {
                    user1Id: u1,
                    user2Id: u2,
                    isActive: true,
                    deletedAt: null,
                },
                select: { id: true }
            });

            if (!existingMatch) {
                // Not matched — return limited data
                return NextResponse.json({
                    userId: profile.userId,
                    displayName: profile.displayName,
                    photos: profile.photos.slice(0, 1),
                    age: profile.age,
                    city: profile.city,
                    isVerified: profile.isVerified,
                    isIncognitoRestricted: true,
                });
            }
        }

        // Skip visit tracking for preview mode
        if (!isPreview) {
            // Record visit (async, don't block response)
            recordProfileVisit(user.id, targetUserId).catch(err => {
                console.error('Error recording visit:', err);
            });
        }

        // Send visit notification (async, throttled) — skip for preview
        if (user.id !== targetUserId && !isPreview) {
            const visitorProfile = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { displayName: true },
            });

            const recentVisit = await prisma.profileVisit.findFirst({
                where: {
                    visitorId: user.id,
                    visitedId: targetUserId,
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (!recentVisit || recentVisit.createdAt < new Date(Date.now() - 4 * 60 * 60 * 1000)) {
                notifyProfileVisit(targetUserId, visitorProfile?.displayName || 'Alguien', user.id).catch(() => logger.warn('Failed to notify profile visit'));
            }
        }

        // Fetch quiz results (best score)
        const quizResult = await prisma.quizResult.findFirst({
            where: { userId: targetUserId },
            orderBy: { score: 'desc' },
            select: { score: true, archetype: true },
        });

        // Fetch Spotify account (public data only, no tokens)
        const spotifyAccount = await prisma.spotifyAccount.findUnique({
            where: { userId: targetUserId },
            select: {
                topTracks: true,
                topArtists: true,
                playlistId: true,
                playlistUrl: true,
                lastSyncedAt: true,
            },
        });

        // Strip private fields from response
        const { incognitoMode: _, showMeInDiscover: __, ...safeProfile } = profile;

        const latestAnswer = await getLatestAnswerForUserById(targetUserId);

        return NextResponse.json({
            ...safeProfile,
            quizArchetype: quizResult?.archetype ?? null,
            quizScore: quizResult?.score ?? null,
            spotify: spotifyAccount || null,
            latestAnswer: latestAnswer
                ? {
                    questionId: latestAnswer.questionId,
                    question: latestAnswer.question?.question ?? null,
                    category: latestAnswer.question?.category ?? null,
                    answer: latestAnswer.answer,
                    createdAt: latestAnswer.createdAt.toISOString(),
                }
                : null,
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
