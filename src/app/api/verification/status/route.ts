import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const submission = await prisma.verificationSubmission.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { status: true, createdAt: true, reviewedAt: true }
        });

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { isVerified: true }
        });

        let status: 'verified' | 'pending' | 'rejected' | 'unverified' = 'unverified';

        if (profile?.isVerified) {
            status = 'verified';
        } else if (submission?.status === 'pending') {
            status = 'pending';
        } else if (submission?.status === 'rejected') {
            status = 'rejected';
        }

        return NextResponse.json({
            status,
            isVerified: profile?.isVerified || false,
            lastSubmission: submission?.createdAt || null,
            reviewedAt: submission?.reviewedAt || null,
        });
    } catch (error) {
        console.error('Error getting verification status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
