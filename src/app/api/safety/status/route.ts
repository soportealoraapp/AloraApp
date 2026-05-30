import { NextResponse } from 'next/server';
import { getSafetyStatus } from '@/server/services/women-safety';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const status = await getSafetyStatus(user.id);
        return NextResponse.json(status);
    } catch (error) {
        console.error('Error getting safety status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
