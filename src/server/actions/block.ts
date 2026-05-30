'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
    try {
        // Create or update block record
        await prisma.block.upsert({
            where: {
                blockerId_blockedId: { blockerId, blockedId }
            },
            create: { blockerId, blockedId, reason },
            update: { reason }
        });

        // Deactivate any active match between the two users
        await prisma.match.updateMany({
            where: {
                OR: [
                    { user1Id: blockerId, user2Id: blockedId },
                    { user1Id: blockedId, user2Id: blockerId }
                ],
                isActive: true
            },
            data: {
                isActive: false,
                stage: 'unmatched',
                deletedAt: new Date()
            }
        });

        // Delete notifications between the two users
        await prisma.notification.deleteMany({
            where: {
                userId: blockerId,
                data: { path: ['userId'], equals: blockedId }
            }
        });

        revalidatePath('/discover');
        revalidatePath('/chat');
        revalidatePath('/settings/privacy/blocked');
        return { success: true };
    } catch (error) {
        console.error('Error blocking user:', error);
        return { success: false, error: 'Failed to block user' };
    }
}

export async function unblockUser(blockerId: string, blockedId: string) {
    try {
        await prisma.block.deleteMany({
            where: {
                blockerId,
                blockedId
            }
        });
        revalidatePath('/discover');
        revalidatePath('/settings/privacy/blocked');
        return { success: true };
    } catch (error) {
        console.error('Error unblocking user:', error);
        return { success: false, error: 'Failed to unblock user' };
    }
}

export async function getBlockedUsers(userId: string) {
    try {
        const blocks = await prisma.block.findMany({
            where: { blockerId: userId }
        });

        const blockedIds = blocks.map(b => b.blockedId);

        if (blockedIds.length === 0) return [];

        const blockedUsers = await prisma.profile.findMany({
            where: { userId: { in: blockedIds } },
            include: { user: true }
        });

        return blockedUsers.map(p => ({
            id: p.userId,
            blockedId: p.userId,
            displayName: p.displayName,
            photoUrl: p.photos[0] || null,
            reason: blocks.find(b => b.blockedId === p.userId)?.reason,
            createdAt: blocks.find(b => b.blockedId === p.userId)?.createdAt
        }));

    } catch (error) {
        console.error('Error fetching blocked users', error);
        return [];
    }
}
