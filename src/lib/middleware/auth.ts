import { NextRequest, NextResponse } from 'next/server';

export async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function requireAuth(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { uid: user.id } : null;
}

export async function requireUser() {
    const user = await getServerUser();
    if (!user) {
        return null;
    }
    return user;
}
