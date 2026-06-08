import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/match/feed
// Returns list of established matches (for Chat list)
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const intentParam = request.nextUrl.searchParams.get('intent');
        const intent = intentParam === 'friendship' ? 'friendship' : intentParam === 'dating' ? 'dating' : undefined;
        const matches = await prisma.match.findMany({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id }
                ],
                isActive: true,
                ...(intent ? { intent } : {})
            },
            include: {
                user1: { include: { profile: true } },
                user2: { include: { profile: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Format for frontend
        const formattedMatches = matches.map(match => {
            const isUser1 = match.user1Id === user.id;
            const partner = isUser1 ? match.user2 : match.user1;
            const partnerProfile = partner.profile;

            return {
                id: match.id,
                users: [match.user1Id, match.user2Id], // Legacy array format
                usersData: {
                    [match.user1Id]: match.user1,
                    [match.user2Id]: match.user2
                },
                lastMessage: match.messages[0] ? {
                    ...match.messages[0],
                    text: match.messages[0].content // Mapping content to text for frontend compat
                } : null,
                createdAt: match.createdAt,
                intent: match.intent,
                partner: {
                    id: partner.id,
                    displayName: partnerProfile?.displayName,
                    photoURL: partnerProfile?.photos?.[0] || null,
                    photos: partnerProfile?.photos || [],
                    isVerified: partnerProfile?.isVerified,
                }
            };
        });

        return NextResponse.json(formattedMatches);
    } catch (error) {
        console.error('Error getting matches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
