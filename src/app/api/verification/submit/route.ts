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

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { selfieUrl, gesture } = await request.json();

        if (!selfieUrl) {
            return NextResponse.json({ error: 'Missing selfie URL' }, { status: 400 });
        }

        // Validate selfieUrl is from a trusted source (UploadThing)
        try {
            const url = new URL(selfieUrl);
            const isTrusted = url.hostname === 'utfs.io' || url.hostname.endsWith('.utfs.io');
            if (!isTrusted || url.protocol !== 'https:') {
                return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
        }

        const validGestures = ['smile', 'v_sign', 'thumbs_up', 'open_palm'];
        const gestureValue = validGestures.includes(gesture) ? gesture : null;

        const existing = await prisma.verificationSubmission.findFirst({
            where: { userId: user.id }
        });

        if (existing) {
            await prisma.verificationSubmission.update({
                where: { id: existing.id },
                data: {
                    selfieUrl,
                    gesture: gestureValue,
                    status: 'pending',
                    reason: null,
                    reviewedAt: null,
                }
            });
        } else {
            await prisma.verificationSubmission.create({
                data: {
                    userId: user.id,
                    selfieUrl,
                    gesture: gestureValue,
                    status: 'pending',
                }
            });
        }

        return NextResponse.json({
            status: 'pending',
            message: 'Tu verificación ha sido recibida. La revisaremos en 24-48 horas.',
        });
    } catch (error) {
        console.error('Error submitting verification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
