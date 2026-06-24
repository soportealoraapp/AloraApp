import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/notifications/preferences — Get user notification preferences
export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.id }
        });

        // Create default preferences if none exist
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId: user.id }
            });
        }

        return NextResponse.json(prefs);
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/notifications/preferences — Update notification preferences
export async function PUT(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'notification');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();

        const allowedFields = ['matches', 'messages', 'profileViews', 'promotions', 'dailyQuestion', 'streakReminder', 'readReceipts', 'notifications'];
        const updateData: Record<string, boolean> = {};

        for (const field of allowedFields) {
            if (field in body && typeof body[field] === 'boolean') {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: user.id },
            update: updateData,
            create: { userId: user.id, ...updateData }
        });

        return NextResponse.json(prefs);
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
