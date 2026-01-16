import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { chatServerService } from '@/lib/firebase/server/chat-service';

// POST /api/chat/send
export async function POST(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const { matchId, receiverId, text, type } = await request.json();

        if (!matchId || !receiverId || !text) {
            return NextResponse.json(
                { error: 'matchId, receiverId, and text are required' },
                { status: 400 }
            );
        }

        const message = await chatServerService.sendMessage(
            matchId,
            decoded.uid,
            receiverId,
            text,
            type || 'text'
        );

        // Fire and forget moderation (Simulating async behavior for v1.0)
        // In a real production environment, this would be a background job.
        chatServerService.moderateMessage(message.id, text).catch(err => {
            console.error('Moderation error for message:', message.id, err);
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
