import { NextResponse } from 'next/server';
import { generateCompatibilityInsights } from '@/ai/copilot/compatibility-insights';
import { prisma } from '@/lib/prisma';
import { calculateCompatibility } from '@/lib/compatibility/engine';
import { withRateLimit } from '@/server/utils/api-rate-limit';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await withRateLimit(user.id, 'ai');
        if (rateLimitResponse) return rateLimitResponse;

        const { candidateId } = await request.json();
        if (!candidateId) {
            return NextResponse.json({ error: 'candidateId required' }, { status: 400 });
        }

        // IDOR protection: verify there is an active match between the two users
        const existingMatch = await prisma.match.findFirst({
            where: {
                intent: 'dating',
                OR: [
                    { user1Id: user.id, user2Id: candidateId },
                    { user1Id: candidateId, user2Id: user.id },
                ],
            },
            select: { id: true },
        });
        if (!existingMatch) {
            return NextResponse.json({ error: 'No match found with this user' }, { status: 403 });
        }

        // Get both profiles
        const [userProfile, candidateProfile] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: { displayName: true, interests: true, values: true, bio: true, lookingFor: true }
            }),
            prisma.profile.findUnique({
                where: { userId: candidateId },
                select: { displayName: true, interests: true, values: true, bio: true, lookingFor: true }
            }),
        ]);

        if (!userProfile || !candidateProfile) {
            return NextResponse.json({ error: 'Profiles not found' }, { status: 404 });
        }

        // Get compatibility scores
        const compatibility = await calculateCompatibility(user.id, candidateId);

        const insights = await generateCompatibilityInsights(
            {
                displayName: userProfile.displayName || '',
                interests: userProfile.interests,
                values: userProfile.values,
                bio: userProfile.bio || '',
                lookingFor: (userProfile as any).lookingFor || undefined,
            },
            {
                displayName: candidateProfile.displayName || '',
                interests: candidateProfile.interests,
                values: candidateProfile.values,
                bio: candidateProfile.bio || '',
                lookingFor: (candidateProfile as any).lookingFor || undefined,
            },
            {
                values: compatibility.dimensions.values,
                relationshipGoals: compatibility.dimensions.relationshipGoals,
                personality: compatibility.dimensions.personality,
                interests: compatibility.dimensions.interests,
                lifestyle: compatibility.dimensions.lifestyle,
            }
        );

        return NextResponse.json(insights);
    } catch (error) {
        console.error('Error generating compatibility insights:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
