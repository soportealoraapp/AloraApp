'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Match, Like } from '@/lib/firebase/types';
import { useToast } from './use-toast';

export function useMatches() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [matches, setMatches] = useState<Match[]>([]);
    const [newMatches, setNewMatches] = useState<Like[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = await user.getIdToken();

            // Fetch matches existentes
            const matchesResponse = await fetch('/api/match/feed', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            // Fetch nuevos matches (quien te gustó)
            const newMatchesResponse = await fetch('/api/match/new', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!matchesResponse.ok || !newMatchesResponse.ok) {
                throw new Error('Error al cargar matches');
            }

            const matchesData = await matchesResponse.json();
            const newMatchesData = await newMatchesResponse.json();

            setMatches(matchesData);
            setNewMatches(newMatchesData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const sendLike = async (toUserId: string, type: 'like' | 'superlike' = 'like') => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/match/like', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ toUserId, type }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar like');
            }

            const result = await response.json();

            if (result.matched) {
                toast({
                    title: '¡Nuevo match! 🎉',
                    description: 'Ahora puedes chatear.',
                });
                // Refresh matches
                await fetchMatches();
            } else {
                toast({
                    title: type === 'superlike' ? '¡Super Like enviado! ✨' : 'Like enviado ❤️',
                    description: '¡Ojalá hagan match!',
                });
            }

            return result;
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo enviar el like',
            });
            throw err;
        }
    };

    return {
        matches,
        newMatches,
        loading,
        error,
        sendLike,
        refresh: fetchMatches,
    };
}
