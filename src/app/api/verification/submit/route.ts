import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { selfieUrl } = await request.json();

        if (!selfieUrl) {
            return NextResponse.json({ error: 'Missing selfie URL' }, { status: 400 });
        }

        // Store the verification submission
        await prisma.report.create({
            data: {
                reporterId: user.id,
                reportedId: user.id,
                reason: 'verification_request',
                details: JSON.stringify({
                    type: 'verification',
                    selfieUrl,
                    status: 'pending',
                    submittedAt: new Date().toISOString(),
                }),
                status: 'pending',
            }
        });

        return NextResponse.json({
            status: 'pending',
            message: 'Tu verificación ha sido recibida. La revisaremos en 24-48 horas.',
        });
    } catch (error) {
        console.error('Error submitting verification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
