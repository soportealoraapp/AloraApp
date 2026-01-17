'use client';

import { useAuth } from '@/contexts/AuthContext';
import { blockUser, unblockUser } from '@/server/actions/block';

export function useBlock() {
    const { user } = useAuth();

    const handleBlock = async (blockedId: string, reason?: string) => {
        if (!user) return;
        await blockUser(user.id, blockedId, reason);
    };

    const handleUnblock = async (blockedId: string) => {
        if (!user) return;
        await unblockUser(user.id, blockedId);
    };

    // For "isBlocked", usually we would have a loaded list of blocked IDs in context or SWR
    // For now, simpler implementation:
    const isBlocked = (id: string) => {
        // This requires active state which we don't have deeply integrated in this hook yet
        // In a real app, we'd pass the blocked list from a provider.
        return false;
    };

    return {
        blockUser: handleBlock,
        unblockUser: handleUnblock,
        isBlocked // Minimal implementation
    };
}
