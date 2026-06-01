import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReferralCode, generateReferralLink, getReferralStats } from '@/server/actions/referral';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [code, link, stats, invitedUsers] = await Promise.all([
            getReferralCode(user.id),
            generateReferralLink(user.id),
            getReferralStats(user.id),
            prisma.referral.findMany({
                where: {
                    referrerId: user.id,
                    referredId: { not: null },
                },
                orderBy: { completedAt: 'desc' },
                take: 20,
            }),
        ]);

        const referredIds = invitedUsers
            .filter(r => r.referredId)
            .map(r => r.referredId as string);

        const profiles = referredIds.length > 0
            ? await prisma.profile.findMany({
                where: { userId: { in: referredIds } },
                select: {
                    userId: true,
                    displayName: true,
                    photos: true,
                },
            })
            : [];

        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        const invitedList = invitedUsers
            .filter(r => r.referredId)
            .map(r => {
                const profile = profileMap.get(r.referredId!);
                return {
                    id: r.referredId,
                    name: profile?.displayName || 'Usuario',
                    photo: profile?.photos?.[0] || '/placeholder.svg',
                    status: r.status,
                    completedAt: r.completedAt,
                };
            });

        return NextResponse.json({
            code,
            link,
            stats,
            invited: invitedList,
        });
    } catch (error) {
        console.error('Error fetching referral data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
