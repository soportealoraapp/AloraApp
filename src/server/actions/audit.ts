'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AuditLog } from '@/lib/domain/types';

export async function logAuditAction(
    userId: string,
    action: AuditLog['action'],
    details?: any
) {
    try {
        await addDoc(collection(db, 'auditLogs'), {
            userId,
            action,
            details,
            timestamp: serverTimestamp(),
            userAgent: 'server-action', // simplified
        });
    } catch (error) {
        console.error('Failed to log audit action', error);
        // Fail silently to not block user flow
    }
}
