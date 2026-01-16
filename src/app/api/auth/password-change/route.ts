import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { sessionManagementServerService } from '@/lib/firebase/server/session-management-service';

/**
 * POST /api/auth/password-change
 * Revokes all sessions after password change.
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const userId = authResult.uid;

        await sessionManagementServerService.onPasswordChange(userId);

        return NextResponse.json({ success: true, message: 'All sessions revoked. Please login again.' });
    } catch (error) {
        console.error('Password change session revoke error:', error);
        return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
    }
}
