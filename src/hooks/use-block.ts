'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BlockedUser {
    id: string;
    blockedId: string;
    displayName?: string;
    photoUrl?: string;
    reason?: string;
    createdAt?: string;
}

export function useBlock() {
    const { user } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlocked = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch('/api/safety/block');
            if (response.ok) {
                const users = await response.json();
                setBlockedUsers(users);
            }
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
        const response = await fetch('/api/safety/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockedId, reason })
        });
        if (!response.ok) throw new Error('Error al bloquear usuario');
        await fetchBlocked();
    };

    const unblockUser = async (blockedId: string) => {
        if (!user) return;
        const response = await fetch('/api/safety/block', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockedId })
        });
        if (!response.ok) throw new Error('Error al desbloquear usuario');
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
