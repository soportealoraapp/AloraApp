import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { userId, city, reason } = await req.json();
        if (!userId || !city || !reason) {
            return NextResponse.json({ error: 'userId, city, and reason are required' }, { status: 400 });
        }

        const application = await prisma.auditLog.create({
            data: {
                userId,
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
