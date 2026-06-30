import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'upload');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { matchId, imageUrl } = await request.json();

        if (!matchId || !imageUrl) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Validate imageUrl is from a trusted source (UploadThing or Supabase)
        const allowedHosts = ['utfs.io', 'uploadthing.com', 'supabase.co'];
        try {
            const url = new URL(imageUrl);
            const isTrusted = allowedHosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host));
            if (!isTrusted || url.protocol !== 'https:') {
                return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
            }

            // Validate file size via HEAD request (max 4MB)
            const headResponse = await fetch(imageUrl, { method: 'HEAD' }).catch(() => null);
            if (headResponse) {
                const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);
                if (contentLength > 4 * 1024 * 1024) {
                    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
                }
            }
        } catch {
            return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
        }

        // Verify match ownership
        const match = await prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 403 });
        }

        // Block check
        const receiverId = match.user1Id === user.id ? match.user2Id : match.user1Id;
        const blockExists = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: user.id, blockedId: receiverId },
                    { blockerId: receiverId, blockedId: user.id }
                ]
            }
        });

        if (blockExists) {
            return NextResponse.json({ error: 'Interaction not available' }, { status: 403 });
        }

        const message = await prisma.message.create({
            data: {
                matchId,
                senderId: user.id,
                content: imageUrl,
                type: 'image',
                status: 'sent',
            }
        });

        await prisma.match.update({
            where: { id: matchId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error uploading chat image:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
