import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordProfileVisit } from '@/server/services/visit-tracker';

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

    try {
        const targetUserId = params.userId;

        const profile = await prisma.profile.findUnique({
            where: { userId: targetUserId }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Record visit (async, don't block response)
        recordProfileVisit(user.id, targetUserId).catch(err => {
            console.error('Error recording visit:', err);
        });

        // Hide private fields
        const { incognitoMode, showMeInDiscover, ...safeProfile } = profile as any;
        return NextResponse.json(safeProfile);
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
