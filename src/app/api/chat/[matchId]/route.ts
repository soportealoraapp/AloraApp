import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Message } from '@/lib/domain/types';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

interface HistoryResponse {
    messages: Message[];
    hasMore: boolean;
    nextCursor: string | null;
    nextOffset: number | null;
}

/**
 * GET /api/chat/[matchId]
 *
 * Paginated history for a match.
 * - Validates that the caller is part of the match (ownership).
 * - Supports two pagination modes:
 *     1) ?offset=N&limit=L  — classic offset pagination, ordered by createdAt asc.
 *     2) ?before=<messageId> — cursor pagination: returns messages older than the
 *        given message (excluding the cursor message itself).
 * - The contract: response is always ordered oldest -> newest so the client can
 *   append to the top of its chronologically-sorted list without an extra reverse.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    if (!matchId) {
        return NextResponse.json({ error: 'matchId required' }, { status: 400 });
    }

    // Ownership check: caller must be a participant in the match.
    const match = await prisma.match.findFirst({
        where: {
            id: matchId,
            OR: [{ user1Id: user.id }, { user2Id: user.id }],
        },
        select: { id: true, user1Id: true, user2Id: true },
    });

    if (!match) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const offsetParam = searchParams.get('offset');
    const limitParam = searchParams.get('limit');

    let limit = DEFAULT_LIMIT;
    if (limitParam) {
        const parsed = parseInt(limitParam, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return NextResponse.json({ error: 'Invalid limit' }, { status: 400 });
        }
        limit = Math.min(parsed, MAX_LIMIT);
    }

    // Pagination by cursor (messageId)
    if (before) {
        const cursor = await prisma.message.findUnique({
            where: { id: before },
            select: { createdAt: true, matchId: true },
        });

        if (!cursor || cursor.matchId !== matchId) {
            return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
        }

        // Fetch one extra to compute hasMore
        const rows = await prisma.message.findMany({
            where: {
                matchId,
                createdAt: { lt: cursor.createdAt },
            },
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
        });

        const hasMore = rows.length > limit;
        const slice = hasMore ? rows.slice(0, limit) : rows;
        const messages = slice.map(toDomain);
        const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1].id : null;

        return NextResponse.json({
            messages,
            hasMore,
            nextCursor,
            nextOffset: null,
        } satisfies HistoryResponse);
    }

    // Offset-based pagination
    let offset = 0;
    if (offsetParam) {
        const parsed = parseInt(offsetParam, 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return NextResponse.json({ error: 'Invalid offset' }, { status: 400 });
        }
        offset = parsed;
    }

    const rows = await prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const messages = slice.map(toDomain);
    const nextOffset = hasMore ? offset + limit : null;
    const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1].id : null;

    return NextResponse.json({
        messages,
        hasMore,
        nextCursor,
        nextOffset,
    } satisfies HistoryResponse);
}

function toDomain(row: {
    id: string;
    matchId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    readAt: Date | null;
    type: string;
    status: string;
    reactions: any;
}): Message {
    return {
        id: row.id,
        matchId: row.matchId,
        senderId: row.senderId,
        content: row.content,
        createdAt: row.createdAt,
        readAt: row.readAt ?? undefined,
        type: (row.type as Message['type']) || 'text',
        status: (row.status as Message['status']) || 'sent',
        reactions: (row.reactions as Record<string, string>) || {},
    };
}
