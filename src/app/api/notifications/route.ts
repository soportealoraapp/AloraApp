import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { ensureSubscriptionState } from '@/lib/subscription-helper';

const MAX_LIMIT = 50;

export async function GET(request: Request) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureSubscriptionState(userId);

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const onlyUnread = url.searchParams.get('unread') === 'true';
    let limit = Number.parseInt(limitParam ?? '', 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const [items, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId, ...(onlyUnread ? { readAt: null } : {}) },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                type: true,
                title: true,
                body: true,
                data: true,
                readAt: true,
                createdAt: true,
            },
        }),
        prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return NextResponse.json({
        notifications: items.map(n => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
            readAt: n.readAt?.toISOString() ?? null,
        })),
        unreadCount,
    });
}

export async function PATCH(request: Request) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { ids?: string[]; markAll?: boolean } = {};
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const now = new Date();
    if (body.markAll) {
        const result = await prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: now },
        });
        return NextResponse.json({ updated: result.count });
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
        const result = await prisma.notification.updateMany({
            where: { userId, id: { in: body.ids } },
            data: { readAt: now },
        });
        return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
}

export async function DELETE(request: Request) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }

        await prisma.notification.delete({
            where: { id, userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
