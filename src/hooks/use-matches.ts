'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionIntent, Match } from '@/lib/domain/types';
import { authFetch } from '@/lib/utils';
import { useSendLike } from './use-send-like';
import { createClient } from '@/lib/supabase/client';

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
    const [matches, setMatches] = useState<Match[]>([]);
    const [newMatches, setNewMatches] = useState<LikePreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<any>(null);

    const fetchMatches = useCallback(async (intent?: ConnectionIntent) => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const suffix = intent ? `?intent=${intent}` : '';
            const [matchesResponse, newMatchesResponse] = await Promise.all([
                authFetch(`/api/match/feed${suffix}`),
                authFetch(`/api/match/new${suffix}`),
            ]);

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

    // Realtime subscription for new matches
    useEffect(() => {
        if (!user?.id) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`matches:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                },
                (payload) => {
                    const match = payload.new as any;
                    // Only process matches where this user is a participant
                    if (match.user1Id === user.id || match.user2Id === user.id) {
                        // Refresh matches to get full data
                        fetchMatches();
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[use-matches] Realtime channel error, will retry on next reconnect');
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user?.id, fetchMatches]);

    const { sendLike: baseSendLike } = useSendLike((intent) => {
        fetchMatches(intent);
    });

    const sendLike = useCallback(async (
        toUserId: string,
        type: 'like' | 'superlike' | 'pass' = 'like',
        intent: ConnectionIntent = 'dating',
        showToast: boolean = true
    ) => {
        return baseSendLike(toUserId, type, intent, showToast);
    }, [baseSendLike]);

    return {
        matches,
        newMatches,
        loading,
        error,
        sendLike,
        refresh: fetchMatches,
    };
}
