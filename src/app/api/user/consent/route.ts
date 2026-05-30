import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { version } = body;

        if (!version) {
            return NextResponse.json({ error: 'Version required' }, { status: 400 });
        }

        return NextResponse.json({ success: true, version });
    } catch (error) {
        console.error('Consent error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
