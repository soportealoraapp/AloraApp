import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/middleware/admin';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const stories = await prisma.successStory.findMany({
            orderBy: [{ approved: 'desc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json({ stories });
    } catch (error) {
        console.error('Error fetching stories:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { title, story, photoUrl, authorId, approved } = await request.json();

        if (!title || !story) {
            return NextResponse.json({ error: 'title and story are required' }, { status: 400 });
        }

        const created = await prisma.successStory.create({
            data: {
                title,
                story,
                photoUrl: photoUrl || null,
                authorId: authorId || null,
                approved: approved ?? false,
            },
        });

        return NextResponse.json({ story: created });
    } catch (error) {
        console.error('Error creating story:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { id, approved, title, story, photoUrl } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const updated = await prisma.successStory.update({
            where: { id },
            data: {
                ...(typeof approved === 'boolean' ? { approved } : {}),
                ...(title ? { title } : {}),
                ...(story ? { story } : {}),
                ...(photoUrl !== undefined ? { photoUrl } : {}),
            },
        });

        return NextResponse.json({ story: updated });
    } catch (error) {
        console.error('Error updating story:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.successStory.delete({ where: { id } });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting story:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
