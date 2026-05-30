import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { subscriptionStatus: true }
        });

        // Check if user is premium (boost is a premium feature)
        const isPremium = profile?.subscriptionStatus === 'plus' || profile?.subscriptionStatus === 'premium';
        if (!isPremium) {
            return NextResponse.json({ error: 'Boost es un features premium' }, { status: 403 });
        }

        // Record boost activation
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'boost_activated',
                metadata: { timestamp: new Date().toISOString() },
            }
        });

        // Update lastActiveAt to boost visibility
        await prisma.profile.update({
            where: { userId: user.id },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json({ success: true, message: 'Boost activado por 30 minutos' });
    } catch (error) {
        console.error('Error activating boost:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
