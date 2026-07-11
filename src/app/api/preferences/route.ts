import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { preferencesService } from '@/lib/preferences-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const prefs = await preferencesService.getPreferences(user.id);
        return NextResponse.json(prefs);
    } catch (error) {
        console.error('Error loading preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { incognito, showMe } = body as { incognito?: boolean; showMe?: boolean };

        const result = await preferencesService.updatePreferences(user.id, { incognito, showMe });
        if (!result.success) {
            return NextResponse.json({ error: result.error, message: result.message }, { status: 403 });
        }

        return NextResponse.json({ success: true, incognito, showMe });
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
