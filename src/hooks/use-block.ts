'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Block } from '@/lib/firebase/types';
import { useToast } from './use-toast';

export function useBlock() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [blockedUsers, setBlockedUsers] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlockedUsers = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/block', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Error al cargar bloqueados');

            const data = await response.json();
            setBlockedUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const blockUser = async (blockedId: string, reason?: string) => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/block', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ blockedId, reason }),
            });

            if (!response.ok) throw new Error('Error al bloquear');

            toast({
                title: 'Usuario bloqueado',
                description: 'Ya no podrán contactarte.',
            });

            await fetchBlockedUsers();
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo bloquear al usuario',
            });
            throw err;
        }
    };

    const unblockUser = async (blockedId: string) => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/block?blockedId=${blockedId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Error al desbloquear');

            toast({
                title: 'Usuario desbloqueado',
                description: 'Ahora podrás verlo en Descubrir.',
            });

            await fetchBlockedUsers();
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo desbloquear al usuario',
            });
            throw err;
        }
    };

    return {
        blockedUsers,
        loading,
        blockUser,
        unblockUser,
        refresh: fetchBlockedUsers,
    };
}
