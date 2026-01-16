import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sessionManagementServerService } from '@/lib/firebase/server/session-management-service';

/**
 * POST /api/auth/session
 * Called after client-side Firebase Auth login to create managed session.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ error: 'ID token required' }, { status: 400 });
        }

        // Verify Firebase ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Create managed session with refresh token
        const tokens = await sessionManagementServerService.onLoginSuccess(userId, idToken, false);

        return NextResponse.json({
            accessToken: tokens.accessToken,
            refreshTokenId: tokens.refreshTokenId,
            expiresAt: tokens.expiresAt
        });
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
