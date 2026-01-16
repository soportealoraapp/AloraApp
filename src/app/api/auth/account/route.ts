import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { sessionManagementServerService } from '@/lib/firebase/server/session-management-service';

/**
 * DELETE /api/auth/account
 * Full account deletion with session revocation and soft-delete.
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const userId = authResult.uid;

        await sessionManagementServerService.onAccountDelete(userId);

        return NextResponse.json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
