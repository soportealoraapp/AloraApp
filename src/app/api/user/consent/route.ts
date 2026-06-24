import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await withRateLimit(user.id, 'analytics');
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        const { version } = body;

        if (!version) {
            return NextResponse.json({ error: 'Version required' }, { status: 400 });
        }

        // Persist GDPR consent as an analytics event
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'gdpr_consent',
                metadata: {
                    version,
                    consentedAt: new Date().toISOString(),
                },
            },
        });

        return NextResponse.json({ success: true, version });
    } catch (error) {
        console.error('Consent error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
