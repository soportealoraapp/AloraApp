import { NextRequest, NextResponse } from 'next/server';
import { getUserPrompts, upsertUserPrompt, deleteUserPrompt } from '@/server/services/prompts';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const prompts = await getUserPrompts(user.id);
        return NextResponse.json({ prompts });
    } catch (error) {
        console.error('Error fetching user prompts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileWrite');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { promptId, answer, position } = body;

        if (!promptId || typeof promptId !== 'string') {
            return NextResponse.json({ error: 'Falta la pregunta seleccionada' }, { status: 400 });
        }

        const prompt = await upsertUserPrompt(user.id, promptId, answer ?? '', position);
        return NextResponse.json({ prompt });
    } catch (error) {
        console.error('Error saving prompt:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 400 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'Falta el id de la pregunta' }, { status: 400 });
        }

        await deleteUserPrompt(user.id, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
