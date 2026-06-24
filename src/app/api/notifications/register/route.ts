import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'notification');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { token, platform, deviceId } = await request.json();

        if (!token || !platform) {
            return NextResponse.json({ error: 'Missing token or platform' }, { status: 400 });
        }

        // Check if token already belongs to another user — prevent token takeover
        const existingToken = await prisma.pushToken.findUnique({
            where: { token },
            select: { userId: true },
        });

        if (existingToken && existingToken.userId !== user.id) {
            // Token belongs to another user — reject to prevent hijacking
            return NextResponse.json({ error: 'Token already registered to another account' }, { status: 409 });
        }

        await prisma.pushToken.upsert({
            where: { token },
            update: {
                userId: user.id,
                platform,
                deviceId: deviceId || null,
                lastSeen: new Date(),
            },
            create: {
                token,
                userId: user.id,
                platform,
                deviceId: deviceId || null,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error registering push token:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'notification');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        await prisma.pushToken.deleteMany({ where: { token, userId: user.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing push token:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
