'use server';

import { prisma } from '@/lib/prisma';

export async function logAuditAction(
    userId: string,
    action: string,
    details?: any
) {
    try {
        const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!userExists) {
            await prisma.user.upsert({
                where: { id: userId },
                create: { id: userId, email: `${userId}@pending.local` },
                update: {},
            });
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details: details ?? {},
            },
        });
    } catch (error) {
        console.error('Failed to log audit action', error);
    }
}
