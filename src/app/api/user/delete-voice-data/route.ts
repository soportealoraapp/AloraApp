import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        await prisma.profile.update({
            where: { userId },
            data: { voiceIntro: null, voiceIntroDuration: null },
        });

        await prisma.message.deleteMany({
            where: { senderId: userId, type: 'voice' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting voice data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
