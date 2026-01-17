'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
    try {
        await prisma.block.create({
            data: {
                blockerId,
                blockedId,
                reason
            }
        });
        revalidatePath('/app'); // Revalidate all potentially to hide user
        return { success: true };
    } catch (error) {
        console.error('Error blocking user:', error);
        return { success: false, error: 'Failed to block user' };
    }
}

export async function unblockUser(blockerId: string, blockedId: string) {
    try {
        // Unique constraint on blockerId_blockedId allows simple delete (if we had the block ID)
        // But we might need to find it first or use deleteMany
        await prisma.block.deleteMany({
            where: {
                blockerId,
                blockedId
            }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Error unblocking user:', error);
        return { success: false, error: 'Failed to unblock user' };
    }
}

export async function getBlockedUsers(userId: string) {
    try {
        const blocks = await prisma.block.findMany({
            where: { blockerId: userId },
            include: {
                // Determine which user is the blocked one. Since blockerId=me, blockedId is the target.
                // But we don't have relation "blocked" in Block model to User (I defined it in line 332 as String, no relation).
                // Wait, Schema: blockedId String. No relation to User?
                // Step 1678 schema: blockedId String. 
                // I need to add relation to Schema if I want to include it, OR fetch manually.
                // Fetching manually is easier than migrating schema again if I want to minimize risk.
                // But efficient query needs relation.
                // I will fetch manually for now or use my schema knowledge.
                // Actually, I can't use include if relation doesn't exist.
            }
        });

        const blockedIds = blocks.map(b => b.blockedId);

        const blockedUsers = await prisma.profile.findMany({
            where: { userId: { in: blockedIds } },
            include: { user: true }
        });

        return blockedUsers.map(p => ({
            id: p.userId,
            displayName: p.displayName,
            photoUrl: p.photos[0] || null,
            blockedAt: blocks.find(b => b.blockedId === p.userId)?.createdAt
        }));

    } catch (error) {
        console.error('Error fetching blocked users', error);
        return [];
    }
}
