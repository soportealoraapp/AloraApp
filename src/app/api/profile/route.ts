import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';

// GET /api/profile
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    // requireAuth stub currently returns { uid: 'stub' }, but we need real session if possible
    // Wait, middleware auth stub is still there? 
    // We switched middleware.ts to use updateSession from supabase.
    // API routes need real auth check.

    // For now, assuming requireAuth returns { uid: string } correctly from Supabase token?
    // The previous stub was: return { uid: 'stub-user-id' }
    // We need to FIX requireAuth to correct verify token from Supabase or header.
    // BUT for this specific file, let's implement the logic assuming we have UID.

    // Actually, I should use `createClient` from `@/lib/supabase/server` to get user in API route
    // This is the cleanest way.

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/profile
export async function PUT(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const updates = await request.json();

        // Safety cleanup
        delete updates.userId;
        delete updates.id;
        delete updates.createdAt;
        delete updates.updatedAt;

        const updated = await prisma.profile.upsert({
            where: { userId: user.id },
            update: updates,
            create: {
                userId: user.id,
                ...updates
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
