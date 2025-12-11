'use server';

import { logAuditAction } from './audit';

export async function logMatchAction(userId: string, targetId: string, action: 'like' | 'pass') {
    // We can also implement the actual DB write here if we want to move logic to server completely
    // For now, as per hybrid approach, we log it for audit
    await logAuditAction(userId, 'match', { targetId, action });
}
