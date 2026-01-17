'use server';

import { prisma } from '@/lib/prisma';

export async function logAuditAction(
    userId: string,
    action: string,
    details?: any
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details: details ?? {},
            },
        });
    } catch (error) {
        console.error('Failed to log audit action', error);
        // Fail silently
    }
}
