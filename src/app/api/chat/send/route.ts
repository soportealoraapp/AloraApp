import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { chatService } from '@/lib/firebase/chat-service';

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

        const message = await chatService.sendMessage(
            matchId,
            decoded.uid,
            receiverId,
            text,
            type || 'text'
        );

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
