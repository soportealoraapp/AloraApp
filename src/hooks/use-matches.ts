'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionIntent, Match } from '@/lib/domain/types';
import { useToast } from './use-toast';
import { authFetch } from '@/lib/utils';

interface LikePreview {
    id: string;
    displayName: string;
    photoURL: string | null;
    type: string;
    intent: string;
    createdAt: Date;
}

export function useMatches() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [matches, setMatches] = useState<Match[]>([]);
    const [newMatches, setNewMatches] = useState<LikePreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatches = useCallback(async (intent?: ConnectionIntent) => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Cookie auth handles authentication automatically
            const suffix = intent ? `?intent=${intent}` : '';
            const matchesResponse = await authFetch(`/api/match/feed${suffix}`);
            const newMatchesResponse = await authFetch(`/api/match/new${suffix}`);

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

    const sendLike = useCallback(async (toUserId: string, type: 'like' | 'superlike' | 'pass' = 'like', intent: ConnectionIntent = 'dating') => {
        if (!user) return;

        try {
            // Cookie auth handles authentication automatically
            const response = await authFetch('/api/match/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ toUserId, type, intent }),
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
                await fetchMatches(intent);
            } else if (type !== 'pass') {
                toast({
                    title: type === 'superlike' ? '¡Flechado enviado! ✨' : 'Like enviado ❤️',
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
    }, [user, fetchMatches, toast]);

    return {
        matches,
        newMatches,
        loading,
        error,
        sendLike,
        refresh: fetchMatches,
    };
}
