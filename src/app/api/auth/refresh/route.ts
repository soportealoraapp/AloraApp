import { NextRequest, NextResponse } from 'next/server';
import { sessionManagementServerService } from '@/lib/firebase/server/session-management-service';

/**
 * POST /api/auth/refresh
 * Rotates refresh token. Throws if reuse detected.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, refreshTokenId } = body;

        if (!userId || !refreshTokenId) {
            return NextResponse.json({ error: 'userId and refreshTokenId required' }, { status: 400 });
        }

        // Validate and rotate
        const tokens = await sessionManagementServerService.refreshSession(userId, refreshTokenId);

        return NextResponse.json({
            accessToken: tokens.accessToken,
            refreshTokenId: tokens.refreshTokenId,
            expiresAt: tokens.expiresAt
        });
    } catch (error: any) {
        console.error('Refresh error:', error);
        // If token reuse detected, all sessions already invalidated
        if (error.message?.includes('Token reuse detected')) {
            return NextResponse.json({ error: 'Session compromised. All sessions revoked.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }
}
