import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { chatService } from '@/lib/firebase/chat-service';

// GET /api/chat/[matchId]
export async function GET(
    request: NextRequest,
    { params }: { params: { matchId: string } }
) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const matchId = params.matchId;
        const messages = await chatService.getMessages(matchId);

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
