import { NextResponse } from 'next/server';
import { generatePostMatchData } from '@/server/services/post-match';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { matchId } = await request.json();
        if (!matchId) {
            return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        const data = await generatePostMatchData(matchId);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating post-match data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
