import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { city, reason } = await req.json();
        if (!city || !reason) {
            return NextResponse.json({ error: 'city and reason are required' }, { status: 400 });
        }

        const application = await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'AMBASSADOR_APPLICATION',
                details: { city, reason },
            },
        });

        return NextResponse.json({ success: true, id: application.id });
    } catch (error) {
        console.error('Error submitting ambassador application:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
