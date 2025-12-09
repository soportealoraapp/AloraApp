import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Block } from './types';

export const blockService = {
    // Block user
    async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
        const blockId = `${blockerId}_${blockedId}`;
        const blockRef = doc(db, 'blocks', blockId);

        await setDoc(blockRef, {
            id: blockId,
            blockerId,
            blockedId,
            reason,
            createdAt: serverTimestamp(),
        });
    },

    // Unblock user
    async unblockUser(blockerId: string, blockedId: string): Promise<void> {
        const blockId = `${blockerId}_${blockedId}`;
        const blockRef = doc(db, 'blocks', blockId);
        await deleteDoc(blockRef);
    },

    // Check if user is blocked
    async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
        const blockId = `${blockerId}_${blockedId}`;
        const blockRef = doc(db, 'blocks', blockId);
        const blockSnap = await getDoc(blockRef);
        return blockSnap.exists();
    },

    // Check if either user blocked the other
    async isBlockedEitherWay(userId1: string, userId2: string): Promise<boolean> {
        const blocked1 = await this.isBlocked(userId1, userId2);
        const blocked2 = await this.isBlocked(userId2, userId1);
        return blocked1 || blocked2;
    },

    // Get all users blocked by a user
    async getBlockedUsers(userId: string): Promise<Block[]> {
        const blocksQuery = query(
            collection(db, 'blocks'),
            where('blockerId', '==', userId)
        );

        const snapshot = await getDocs(blocksQuery);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
        })) as Block[];
    },

    // Get blocked user IDs
    async getBlockedUserIds(userId: string): Promise<string[]> {
        const blocks = await this.getBlockedUsers(userId);
        return blocks.map(block => block.blockedId);
    },
};
