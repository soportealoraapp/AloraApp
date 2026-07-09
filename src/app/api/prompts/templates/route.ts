import { NextResponse } from 'next/server';
import { getPromptTemplates } from '@/server/services/prompts';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const templates = await getPromptTemplates();
        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error fetching prompt templates:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
