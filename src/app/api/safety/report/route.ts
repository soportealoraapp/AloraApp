import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_CATEGORIES = [
    'spam',
    'harassment',
    'offensive_language',
    'sexual_content',
    'impersonation',
    'spam_fraud',
    'minor',
    'violence',
    'fake_identity',
    'other',
] as const;

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { reportedId, category, matchId, messageIds, description } = await request.json();

        if (!reportedId) {
            return NextResponse.json({ error: 'Missing reportedId' }, { status: 400 });
        }

        if (!category || !VALID_CATEGORIES.includes(category)) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        if (reportedId === user.id) {
            return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
        }

        const report = await prisma.report.create({
            data: {
                reporterId: user.id,
                reportedId,
                reason: category,
                details: JSON.stringify({
                    category,
                    matchId: matchId || null,
                    messageIds: messageIds || [],
                    description: description || '',
                    timestamp: new Date().toISOString(),
                }),
                status: 'pending',
            }
        });

        // If there's enough reports on this user, auto-escalate trust status
        if (category !== 'spam' && category !== 'other') {
            const reportCount = await prisma.report.count({
                where: { reportedId, status: 'pending' }
            });

            if (reportCount >= 3) {
                await prisma.profile.update({
                    where: { userId: reportedId },
                    data: { trustStatus: 'watchlist' },
                });
            }
        }

        return NextResponse.json({ id: report.id, status: 'pending' });
    } catch (error) {
        console.error('Error submitting report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
