import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        // Hide private fields if needed, but for now return full profile
        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
