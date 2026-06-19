import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { utapi } from '../../uploadthing/core';
import { withRateLimit } from '@/server/utils/api-rate-limit';

async function getUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// GET /api/safety/block — List blocked users
export async function GET() {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const blocks = await prisma.block.findMany({
            where: { blockerId: user.id }
        });

        const blockedIds = blocks.map(b => b.blockedId);
        if (blockedIds.length === 0) return NextResponse.json([]);

        const blockedUsers = await prisma.profile.findMany({
            where: { userId: { in: blockedIds } },
        });

        return NextResponse.json(blockedUsers.map(p => ({
            id: p.userId,
            blockedId: p.userId,
            displayName: p.displayName,
            photoUrl: p.photos[0] || null,
            reason: blocks.find(b => b.blockedId === p.userId)?.reason,
            createdAt: blocks.find(b => b.blockedId === p.userId)?.createdAt
        })));
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/safety/block — Unblock a user
export async function DELETE(request: NextRequest) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'block');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { blockedId } = await request.json();
        if (!blockedId) {
            return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });
        }

        await prisma.block.deleteMany({
            where: { blockerId: user.id, blockedId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/safety/block — Block a user
export async function POST(request: NextRequest) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'block');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { blockedId, reason } = await request.json();

        if (!blockedId) {
            return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });
        }

        if (blockedId === user.id) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: blockedId },
            select: { id: true }
        });
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create block record
        await prisma.block.upsert({
            where: {
                blockerId_blockedId: {
                    blockerId: user.id,
                    blockedId,
                }
            },
            update: { reason: reason || null },
            create: {
                blockerId: user.id,
                blockedId,
                reason: reason || null,
            }
        });

        // Soft-delete any active match between them
        await prisma.match.updateMany({
            where: {
                OR: [
                    { user1Id: user.id, user2Id: blockedId, isActive: true },
                    { user1Id: blockedId, user2Id: user.id, isActive: true },
                ]
            },
            data: {
                isActive: false,
                stage: 'unmatched',
                deletedAt: new Date(),
            }
        });

        // Delete only notifications related to the match between these two users
        const matchBetween = await prisma.match.findFirst({
            where: {
                OR: [
                    { user1Id: user.id, user2Id: blockedId },
                    { user1Id: blockedId, user2Id: user.id },
                ]
            },
            select: { id: true }
        });

        if (matchBetween) {
            await prisma.notification.deleteMany({
                where: {
                    OR: [
                        { userId: user.id, data: { path: ['matchId'], equals: matchBetween.id } },
                        { userId: blockedId, data: { path: ['matchId'], equals: matchBetween.id } },
                    ]
                }
            });

            // Clean up UploadThing files from chat messages (images and voice)
            const mediaMessages = await prisma.message.findMany({
                where: { matchId: matchBetween.id, type: { in: ['image', 'voice'] } },
                select: { content: true, type: true },
            });

            const filesToDelete: string[] = [];
            for (const msg of mediaMessages) {
                try {
                    if (msg.type === 'image' && msg.content?.startsWith('http')) {
                        filesToDelete.push(msg.content);
                    } else if (msg.type === 'voice') {
                        const parsed = JSON.parse(msg.content);
                        if (parsed.audioUrl) filesToDelete.push(parsed.audioUrl);
                    }
                } catch {
                    // Skip malformed content
                }
            }

            if (filesToDelete.length > 0) {
                utapi.deleteFiles(filesToDelete).catch(err =>
                    console.error('Failed to delete chat media from UploadThing:', err)
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
