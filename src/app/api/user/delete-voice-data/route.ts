import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow users to delete their own voice data
        const { userId } = await req.json();
        if (!userId || userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
