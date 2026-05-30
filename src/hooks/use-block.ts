'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { blockUser as blockAction, unblockUser as unblockAction, getBlockedUsers } from '@/server/actions/block';

export function useBlock() {
    const { user } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlocked = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const users = await getBlockedUsers(user.id);
            setBlockedUsers(users);
        } catch (e) {
            console.error('Error fetching blocked users', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchBlocked();
    }, [fetchBlocked]);

    const blockUser = async (blockedId: string, reason?: string) => {
        if (!user) return;
        await blockAction(user.id, blockedId, reason);
        await fetchBlocked();
    };

    const unblockUser = async (blockedId: string) => {
        if (!user) return;
        await unblockAction(user.id, blockedId);
        await fetchBlocked();
    };

    const isBlocked = (id: string) => {
        return blockedUsers.some(b => b.blockedId === id);
    };

    return {
        blockedUsers,
        loading,
        blockUser,
        unblockUser,
        isBlocked
    };
}
