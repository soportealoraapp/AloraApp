import { NextRequest, NextResponse } from 'next/server';
import { recordDeviceFingerprint } from '@/server/services/anti-abuse';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

        const result = await recordDeviceFingerprint(user.id, {
            userAgent: body.userAgent || request.headers.get('user-agent') || undefined,
            platform: body.platform,
            language: body.language,
            timezone: body.timezone,
            screenSize: body.screenSize,
            ipAddress,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error recording fingerprint:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
