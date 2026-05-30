import { NextResponse } from 'next/server';
import { recordDateSignal } from '@/server/services/date-signals';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { matchId, type } = await request.json();
        if (!matchId || !type) {
            return NextResponse.json({ error: 'matchId and type required' }, { status: 400 });
        }

        const validTypes = ['still_talking', 'video_call', 'date', 'dating', 'relationship'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const result = await recordDateSignal(user.id, matchId, type);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error recording date signal:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
